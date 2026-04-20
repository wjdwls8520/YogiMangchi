package com.yogimangchi.domain.futures.dto.response;

import com.yogimangchi.domain.futures.dto.query.FuturesOrderQueryDto;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "선물 주문 내역 조회 응답 — 체결 및 미체결 통합")
public record FuturesOrderResponseDto(

        @Schema(description = "주문 ID", example = "1")
        Long orderId,

        @Schema(description = "심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "코인 한글명", example = "비트코인")
        String displayNameKr,

        @Schema(description = "주문 유형 (MARKET / LIMIT)", example = "MARKET")
        OrderType orderType,

        @Schema(description = "주문 상태 (PENDING / COMPLETED / CANCELED 등)", example = "COMPLETED")
        OrderStatus orderStatus,

        @Schema(description = "포지션 방향 (LONG / SHORT)", example = "LONG")
        PositionSide positionSide,

        @Schema(description = "진입/청산 구분 (OPEN / CLOSE)", example = "OPEN")
        PositionStatus positionAction,

        @Schema(description = "지정가 주문 시 설정 가격 (시장가는 null)", example = "50000.00", nullable = true)
        BigDecimal orderPrice,

        @Schema(description = "실제 체결 평균가", example = "50000.00", nullable = true)
        BigDecimal executedPrice,

        @Schema(description = "주문 수량", example = "0.01")
        BigDecimal orderQuantity,

        @Schema(description = "체결된 수량", example = "0.01")
        BigDecimal filledQuantity,

        @Schema(description = "미체결 잔여 수량", example = "0.00")
        BigDecimal remainingQuantity,

        @Schema(description = "투입 증거금", example = "500.00")
        BigDecimal orderMargin,

        @Schema(description = "명목금액", example = "500.00")
        BigDecimal notionalAmount,

        @Schema(description = "거래 수수료", example = "0.25")
        BigDecimal totalFee,

        @Schema(description = "주문 생성 시각")
        LocalDateTime createdAt,

        @Schema(description = "최종 체결 시각", nullable = true)
        LocalDateTime executedAt
) {
    public static FuturesOrderResponseDto from(FuturesOrderQueryDto q) {
        return new FuturesOrderResponseDto(
                q.orderId(),
                q.symbol(),
                q.displayNameKr(),
                q.orderType(),
                q.orderStatus(),
                q.positionSide(),
                q.positionAction(),
                q.orderPrice(),
                q.executedPrice(),
                q.orderQuantity(),
                q.filledQuantity(),
                q.remainingQuantity(),
                q.orderMargin(),
                q.notionalAmount(),
                q.totalFee(),
                q.createdAt(),
                q.executedAt()
        );
    }
}
