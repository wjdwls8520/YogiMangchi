package com.yogimangchi.domain.spot.event;

import com.yogimangchi.domain.asset.enums.AssetType;

public record SpotOrderExecutedEvent(
        Long memberId,
        AssetType assetType
) {
}
