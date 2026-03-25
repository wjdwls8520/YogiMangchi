package com.yogimangchi.domain.asset.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

public record ParticipateRequestDto(

        @NotNull(message = "콘텐츠 타입은 필수입니다.")
        @Schema(description = "참가할 콘텐츠 타입 (SPOT: 현물, FUTURE: 선물, CONTEST: 대회용)", example = "SPOT")
        AssetType assetType
){}
