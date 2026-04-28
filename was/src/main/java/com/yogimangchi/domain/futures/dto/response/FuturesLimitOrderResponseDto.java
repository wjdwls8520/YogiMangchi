package com.yogimangchi.domain.futures.dto.response;

import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FuturesLimitOrderResponseDto(
        Long orderId,
        String symbol,
        PositionSide positionSide,
        PositionStatus positionAction,
        OrderStatus orderStatus,
        BigDecimal orderPrice,
        BigDecimal orderQuantity,
        BigDecimal orderMargin,
        BigDecimal notionalAmount,
        BigDecimal totalFee,
        LocalDateTime createdAt
) {
    public static FuturesLimitOrderResponseDto from(FuturesOrder order) {
        return new FuturesLimitOrderResponseDto(
                order.getId(),
                order.getSymbol(),
                order.getPositionSide(),
                order.getPositionAction(),
                order.getOrderStatus(),
                order.getOrderPrice(),
                order.getOrderQuantity(),
                order.getOrderMargin(),
                order.getNotionalAmount(),
                order.getTotalFee(),
                order.getCreatedAt()
        );
    }
}
