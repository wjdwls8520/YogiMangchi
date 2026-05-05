package com.yogimangchi.domain.notification.dto.payload;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.futures.enums.PositionSide;

import java.math.BigDecimal;

public record FuturesLiquidationCompletedNotificationPayload(
        AssetType assetType,
        String assetTypeDisplayName,
        String symbol,
        String displayNameKr,
        PositionSide positionSide,       // 강제청산된 포지션 방향 (LONG / SHORT)
        BigDecimal liquidationPrice,     // 강제청산이 실행된 기준 가격
        BigDecimal closeQuantity,        // 강제청산된 코인 수량
        BigDecimal realizedPnl           // 강제청산으로 확정된 손익 (대부분 음수)
) {
}
