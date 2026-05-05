package com.yogimangchi.domain.notification.dto.payload;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FuturesOrderCompletedNotificationPayload(
        Long orderId,
        AssetType assetType,
        String assetTypeDisplayName,
        String symbol,
        String displayNameKr,
        OrderType orderType,
        PositionSide positionSide,
        PositionStatus positionAction,
        BigDecimal price,
        BigDecimal quantity,
        BigDecimal executedAmount,
        BigDecimal executedMargin,
        BigDecimal totalFee,
        // 진입(OPEN)은 포지션을 열기만 한 것이므로 확정된 손익이 없어 null
        // 청산(CLOSE)은 포지션이 종료되며 손익이 확정되므로 값이 존재
        BigDecimal realizedPnl,
        LocalDateTime executedAt
) {
}
