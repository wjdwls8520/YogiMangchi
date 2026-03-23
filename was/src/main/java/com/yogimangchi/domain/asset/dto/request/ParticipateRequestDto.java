package com.yogimangchi.domain.asset.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;

public record ParticipateRequestDto(
        @Schema(description = "참가할 콘텐츠 타입 (SPOT: 현물, FUTURE: 선물, CONTEST: 대회용)", example = "SPOT")
        AssetType assetType
){}
