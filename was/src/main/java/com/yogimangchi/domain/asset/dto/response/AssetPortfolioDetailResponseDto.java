package com.yogimangchi.domain.asset.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

@Schema(
        name = "AssetPortfolioDetailResponseDto",
        description = "모의투자 자산탭 상세 조회용 포트폴리오 응답입니다. 현금, 잠금 금액, 보유 종목 상세를 모두 포함합니다."
)
public record AssetPortfolioDetailResponseDto(

        @Schema(description = "지갑 종류", example = "MOCK", requiredMode = Schema.RequiredMode.REQUIRED)
        String assetType,

        @Schema(description = "보유 코인 종류 수", example = "3", requiredMode = Schema.RequiredMode.REQUIRED)
        int holdingCount,

        @Schema(description = "초기 자본금 (시드머니)", example = "10000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal seedMoney,

        @Schema(description = "주문 가능 금액 (보유 현금)", example = "5000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal cashBalance,

        @Schema(description = "지정가 주문으로 잠겨 있는 현금", example = "1000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal lockedMoney,

        @Schema(description = "총 현금 자산 (주문 가능 금액 + 잠긴 현금)", example = "6000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalCashAsset,

        @Schema(description = "총 매수 금액 (코인 사는데 쓴 돈 합계)", example = "3000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalBuyAmount,

        @Schema(description = "총 평가 금액 (보유 코인들의 현재 가치 합계, 잠긴 코인 포함)", example = "3250.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalCoinValue,

        @Schema(description = "총 보유 자산 (총 현금 자산 + 총 평가금액)", example = "9250.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalAsset,

        @Schema(description = "총 평가 손익", example = "-750.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalProfit,

        @Schema(description = "총 수익률 (%)", example = "-7.50", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalRoi,

        @Schema(description = "보유 코인 목록", requiredMode = Schema.RequiredMode.REQUIRED)
        List<HoldingResponseDto> holdings
) {}
