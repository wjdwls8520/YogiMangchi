package com.yogimangchi.domain.futures.dto.response;

import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "시장가 주문 체결 결과 — 포지션 정보")
public record FuturesPositionResultDto(

        @Schema(description = "포지션 ID", example = "1")
        Long positionId,

        @Schema(description = "심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "포지션 방향 (LONG / SHORT)", example = "LONG")
        PositionSide positionSide,

        @Schema(description = "포지션 상태 (OPEN / CLOSE)", example = "OPEN")
        PositionStatus positionStatus,

        @Schema(description = "보유 수량 (추가 진입 시 합산된 값)", example = "0.01")
        BigDecimal filledQuantity,

        @Schema(description = "평균 진입가 (추가 진입 시 물타기 재계산된 값)", example = "50000.00")
        BigDecimal entryPrice,

        @Schema(description = "총 투입 증거금", example = "500.00")
        BigDecimal totalMargin,

        @Schema(description = "적용 레버리지 배수", example = "1")
        int leverage,

        @Schema(description = "포지션 전체 명목금액", example = "500.00")
        BigDecimal notionalAmount,

        @Schema(description = "강제 청산 가격", example = "45000.00")
        BigDecimal liquidationPrice,

        @Schema(description = "포지션 누적 실현 손익 (청산 시마다 합산)", example = "0.00")
        BigDecimal realizedPnl,

        @Schema(description = "이번 청산에서 발생한 실현 손익 (진입 주문이면 null)", example = "50.00", nullable = true)
        BigDecimal thisCloseRealizedPnl,

        @Schema(description = "신규 포지션 여부 (true: 신규 생성, false: 추가 진입)", example = "true")
        boolean isNewPosition
) {
    // 진입(OPEN) 주문 결과용
    public static FuturesPositionResultDto fromOpen(FuturesPosition position, boolean isNewPosition) {
        return new FuturesPositionResultDto(
                position.getId(),
                position.getSymbol(),
                position.getPositionSide(),
                position.getPositionStatus(),
                position.getFilledQuantity(),
                position.getEntryPrice(),
                position.getTotalMargin(),
                position.getLeverage(),
                position.getNotionalAmount(),
                position.getLiquidationPrice(),
                position.getRealizedPnl(),
                null,           // 진입 주문은 이번 청산 손익 없음
                isNewPosition
        );
    }

    // 청산(CLOSE) 주문 결과용
    public static FuturesPositionResultDto fromClose(FuturesPosition position, BigDecimal thisCloseRealizedPnl) {
        return new FuturesPositionResultDto(
                position.getId(),
                position.getSymbol(),
                position.getPositionSide(),
                position.getPositionStatus(),
                position.getFilledQuantity(),
                position.getEntryPrice(),
                position.getTotalMargin(),
                position.getLeverage(),
                position.getNotionalAmount(),
                position.getLiquidationPrice(),
                position.getRealizedPnl(),
                thisCloseRealizedPnl,
                false           // 청산은 항상 기존 포지션에서 발생
        );
    }
}
