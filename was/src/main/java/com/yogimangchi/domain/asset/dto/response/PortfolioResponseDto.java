package com.yogimangchi.domain.asset.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

public record PortfolioResponseDto(
        @Schema(description = "남은 보유 현금 잔액", example = "50000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal cashBalance,

        @Schema(description = "보유 코인들의 평가 금액 합계", example = "32500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalCoinValue,

        @Schema(description = "내 총 자산 (남은 현금 + 코인 평가 합계)", example = "82500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalAsset,

        @Schema(description = "총 누적 손익 (총 자산 - 초기 자본금)", example = "-17500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalProfit,

        @Schema(description = "총 수익률 (%)", example = "-17.50", requiredMode = Schema.RequiredMode.REQUIRED)
        BigDecimal totalRoi,

        @Schema(description = "보유 중인 코인 상세 목록", requiredMode = Schema.RequiredMode.REQUIRED)
        List<HoldingResponseDto> holdings
) {}