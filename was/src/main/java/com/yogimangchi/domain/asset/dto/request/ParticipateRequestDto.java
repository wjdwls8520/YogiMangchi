package com.yogimangchi.domain.asset.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "사용자가 거래 콘텐츠(모의투자, 실전 현물/선물, 대회)에 참가할 때 사용하는 요청 DTO")
public record ParticipateRequestDto(

        @NotNull(message = "콘텐츠 타입은 필수입니다.")
        @Schema(
                description = "참가할 콘텐츠 타입 (MOCK: 모의투자, TRADE_SPOT: 실전 현물, TRADE_FUTURE: 실전 선물, CONTEST: 대회 선물)",
                example = "TRADE_SPOT"
        )
        AssetType assetType
){}