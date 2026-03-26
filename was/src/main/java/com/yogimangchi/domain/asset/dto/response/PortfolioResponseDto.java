package com.yogimangchi.domain.asset.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;
public record PortfolioResponseDto(

        @Schema(description = "지갑 종류", example = "SPOT", requiredMode = Schema.RequiredMode.REQUIRED)
        String assetType,

        @Schema(description = "보유 코인 종류 수", example = "3", requiredMode = Schema.RequiredMode.REQUIRED)
        int holdingCount,

        @Schema(description = "초기 자본금 (시드머니)", example = "100000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal seedMoney,

        @Schema(description = "주문 가능 금액 (보유 현금)", example = "50000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal cashBalance,

        @Schema(description = "총 매수 금액 (코인 사는데 쓴 돈 합계)", example = "30000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalBuyAmount,

        @Schema(description = "총 평가 금액 (보유 코인들의 현재 가치 합계)", example = "32500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalCoinValue,

        @Schema(description = "총 보유 자산 (주문가능금액 + 총 평가금액)", example = "82500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalAsset,

        @Schema(description = "총 평가 손익", example = "-17500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalProfit,

        @Schema(description = "총 수익률 (%)", example = "-17.50", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalRoi,

        @Schema(description = "보유 코인 목록", requiredMode = Schema.RequiredMode.REQUIRED)
        List<HoldingResponseDto> holdings
) {}