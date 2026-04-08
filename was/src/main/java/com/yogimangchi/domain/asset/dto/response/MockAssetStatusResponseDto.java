package com.yogimangchi.domain.asset.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record MockAssetStatusResponseDto(

        @Schema(description = "로그인 여부", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
        boolean isLogin,

        @Schema(description = "모의투자 참여 여부", example = "false", requiredMode = Schema.RequiredMode.REQUIRED)
        boolean isParticipated
) {}
