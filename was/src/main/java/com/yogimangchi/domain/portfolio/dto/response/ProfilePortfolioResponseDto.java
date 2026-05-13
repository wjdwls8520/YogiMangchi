package com.yogimangchi.domain.portfolio.dto.response;

import com.yogimangchi.domain.asset.dto.response.HoldingResponseDto;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Schema(
        name = "ProfilePortfolioResponseDto",
        description = "프로필 화면에서 사용하는 현재 활성 MOCK 포트폴리오 응답입니다. 자산 요약과 보유 종목 목록, 포트폴리오 정보 변경 시각을 포함합니다."
)
public record ProfilePortfolioResponseDto(

        @Schema(description = "지갑 종류", example = "MOCK", requiredMode = Schema.RequiredMode.REQUIRED)
        String assetType,

        @Schema(description = "보유 코인 종류 수", example = "3", requiredMode = Schema.RequiredMode.REQUIRED)
        int holdingCount,

        @Schema(description = "초기 자본금 (시드머니)", example = "10000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal seedMoney,

        @Schema(description = "주문 가능 금액 (보유 현금)", example = "5000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal cashBalance,

        @Schema(description = "총 매수 금액 (코인 사는데 쓴 돈 합계)", example = "3000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalBuyAmount,

        @Schema(description = "총 평가 금액 (보유 코인들의 현재 가치 합계, 잠긴 코인 포함)", example = "3250.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalCoinValue,

        @Schema(description = "총 보유 자산 (현금 + 보유 코인 평가금액)", example = "8250.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalAsset,

        @Schema(description = "총 평가 손익", example = "-1750.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalProfit,

        @Schema(description = "총 수익률 (%)", example = "-17.50", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalRoi,

        @Schema(description = "지갑 또는 보유자산 정보가 마지막으로 변경된 시각입니다. 실시간 시세 반영 시각은 아닙니다.", example = "2026-04-29T15:42:10", requiredMode = Schema.RequiredMode.REQUIRED)
        LocalDateTime updatedAt,

        @Schema(description = "보유 코인 목록", requiredMode = Schema.RequiredMode.REQUIRED)
        List<HoldingResponseDto> holdings
) {}