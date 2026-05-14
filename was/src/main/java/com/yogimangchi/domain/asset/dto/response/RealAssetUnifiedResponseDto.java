package com.yogimangchi.domain.asset.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(name = "RealAssetUnifiedResponseDto", description = "본투자(현물+선물) 통합 총자산 응답")
public record RealAssetUnifiedResponseDto(
        @Schema(description = "본투자 총 자산 (현물 총자산 + 선물 총 평가 자산)", example = "18250.0000") BigDecimal totalAsset,
        @Schema(description = "본투자 총 손익 (현물 손익 + 선물 손익)", example = "-250.0000") BigDecimal totalProfit,
        @Schema(description = "현물 자산 상세") AssetPortfolioDetailResponseDto spot,
        @Schema(description = "선물 자산 상세") FuturesPortfolioDetailResponseDto futures
) {}