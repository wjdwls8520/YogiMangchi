package com.yogimangchi.domain.futures.dto.response;

import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "시장가 주문 체결 결과 — 주문 정보")
public record FuturesOrderResultDto(

        @Schema(description = "주문 ID", example = "1")
        Long orderId,

        @Schema(description = "심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "포지션 방향 (LONG / SHORT)", example = "LONG")
        PositionSide positionSide,

        @Schema(description = "진입/청산 구분 (OPEN / CLOSE)", example = "OPEN")
        PositionStatus positionAction,

        @Schema(description = "주문 유형 (MARKET / LIMIT)", example = "MARKET")
        OrderType orderType,

        @Schema(description = "주문 상태", example = "COMPLETED")
        OrderStatus orderStatus,

        @Schema(description = "체결 가격", example = "50000.00")
        BigDecimal executedPrice,

        @Schema(description = "체결 수량", example = "0.01")
        BigDecimal executedQuantity,

        @Schema(description = "투입 증거금 (진입 주문 기준)", example = "500.00")
        BigDecimal orderMargin,

        @Schema(description = "명목금액 (체결가 × 수량)", example = "500.00")
        BigDecimal notionalAmount,

        @Schema(description = "거래 수수료", example = "0.25")
        BigDecimal totalFee,

        @Schema(description = "체결 완료 시각")
        LocalDateTime executedAt
) {
    public static FuturesOrderResultDto from(FuturesOrder order) {
        return new FuturesOrderResultDto(
                order.getId(),
                order.getSymbol(),
                order.getPositionSide(),
                order.getPositionAction(),
                order.getOrderType(),
                order.getOrderStatus(),
                order.getAvgFilledPrice(),
                order.getFilledQuantity(),
                order.getOrderMargin(),
                order.getNotionalAmount(),
                order.getTotalFee(),
                order.getExecutedAt()
        );
    }
}
