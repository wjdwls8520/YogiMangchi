package com.yogimangchi.domain.asset.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

public record HoldingResponseDto(
    @Schema(description = "코인 심볼", example = "BTCUSDT", requiredMode = Schema.RequiredMode.REQUIRED)
    String symbol,

    @Schema(description = "내 보유 수량", example = "0.5", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal quantity,

    @Schema(description = "내 매수 평균 단가 (달러)", example = "60000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal averageBuyPrice,

    @Schema(description = "바이낸스 실시간 현재가 (달러)", example = "65000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal currentPrice,

    @Schema(description = "현재 평가 금액 (수량 × 현재가)", example = "32500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal coinTotalValue,

    @Schema(description = "평가 손익 (현재 평가 금액 - 매수 원금)", example = "2500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal profit,

    @Schema(description = "수익률 (%)", example = "8.33", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal roi
) {
}
