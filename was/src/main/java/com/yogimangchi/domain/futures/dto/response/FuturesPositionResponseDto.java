package com.yogimangchi.domain.futures.dto.response;

import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "포지션 조회 응답 — OPEN 목록 및 CLOSE 내역 공통")
public record FuturesPositionResponseDto(

        @Schema(description = "포지션 ID", example = "1")
        Long positionId,

        @Schema(description = "심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "포지션 방향 (LONG / SHORT)", example = "LONG")
        PositionSide positionSide,

        @Schema(description = "포지션 상태 (OPEN / CLOSE)", example = "OPEN")
        PositionStatus positionStatus,

        @Schema(description = "보유 수량", example = "0.01")
        BigDecimal filledQuantity,

        @Schema(description = "평균 진입가", example = "50000.00")
        BigDecimal entryPrice,

        @Schema(description = "총 투입 증거금", example = "500.00")
        BigDecimal totalMargin,

        @Schema(description = "적용 레버리지 배수", example = "1")
        int leverage,

        @Schema(description = "포지션 전체 명목금액", example = "500.00")
        BigDecimal notionalAmount,

        @Schema(description = "강제 청산 가격", example = "45000.00", nullable = true)
        BigDecimal liquidationPrice,

        @Schema(description = "누적 실현 손익 (CLOSE 포지션에서 의미있는 값)", example = "50.00")
        BigDecimal realizedPnl,

        @Schema(description = "포지션 최초 생성 시각")
        LocalDateTime createdAt,

        @Schema(description = "포지션 마지막 변경 시각")
        LocalDateTime updatedAt
) {
    public static FuturesPositionResponseDto from(FuturesPosition position) {
        return new FuturesPositionResponseDto(
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
                position.getCreatedAt(),
                position.getUpdatedAt()
        );
    }
}
