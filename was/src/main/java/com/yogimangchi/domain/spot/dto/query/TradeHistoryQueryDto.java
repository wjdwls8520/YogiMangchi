package com.yogimangchi.domain.spot.dto.query;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.spot.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TradeHistoryQueryDto(
        Long tradeId,
        Long orderId,
        AssetType assetType,
        String symbol,
        String displayNameKr,
        String side,
        String orderType,
        OrderStatus orderStatus,
        BigDecimal price,
        BigDecimal quantity,
        BigDecimal totalAmount,
        BigDecimal fee,
        BigDecimal realizedProfit,
        LocalDateTime orderedAt,
        LocalDateTime executedAt
) {
}
