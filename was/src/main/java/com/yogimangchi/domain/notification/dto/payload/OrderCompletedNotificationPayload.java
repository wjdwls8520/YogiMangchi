package com.yogimangchi.domain.notification.dto.payload;

import com.yogimangchi.domain.asset.enums.AssetType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderCompletedNotificationPayload(
        Long orderId,
        AssetType assetType,
        String symbol,
        String displayNameKr,
        String orderType,
        String side,
        BigDecimal price,
        BigDecimal quantity,
        BigDecimal executedAmount,
        BigDecimal totalFee,
        LocalDateTime executedAt
) {
}
