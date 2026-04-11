package com.yogimangchi.domain.spot.dto.query;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.spot.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderQueryDto(
        Long orderId,
        AssetType assetType,
        String symbol,
        String displayNameKr,
        String orderType,
        String side,
        OrderStatus orderStatus,
        BigDecimal orderPrice,
        BigDecimal orderQuantity,
        BigDecimal orderAmount,
        BigDecimal filledQuantity,
        BigDecimal remainingQuantity,
        BigDecimal avgFilledPrice,
        BigDecimal executedAmount,
        BigDecimal totalFee,
        LocalDateTime orderedAt,
        LocalDateTime executedAt,
        LocalDateTime canceledAt
) {
}
