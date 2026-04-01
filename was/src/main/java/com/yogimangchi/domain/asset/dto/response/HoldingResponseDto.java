package com.yogimangchi.domain.asset.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

public record HoldingResponseDto(
    @Schema(description = "코인 심볼", example = "BTCUSDT", requiredMode = Schema.RequiredMode.REQUIRED)
    String symbol,

    @Schema(description = "총 보유 수량 (가용 + 잠긴 수량)", example = "0.5", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal quantity,

    @Schema(description = "주문 가능한 가용 수량", example = "0.2", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal availableQuantity,

    @Schema(description = "지정가 주문으로 잠겨 있는 수량", example = "0.3", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal lockedQuantity,

    @Schema(description = "내 매수 평균 단가 (달러)", example = "60000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal averageBuyPrice,

    @Schema(description = "바이낸스 실시간 현재가 (달러)", example = "65000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal currentPrice,

    @Schema(description = "매수 금액(투자원금, 잠긴 수량 포함)", example = "30000.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal buyAmount,

    @Schema(description = "현재 평가 금액 (총 보유 수량 × 현재가)", example = "32500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal coinTotalValue,

    @Schema(description = "평가 손익 (현재 평가 금액 - 매수 원금)", example = "2500.0000", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal profit,

    @Schema(description = "수익률 (%)", example = "8.33", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal roi,

    @Schema(description = "자산 비중 % - 총 자산 대비 이 코인의 비율", example = "35.50", requiredMode = Schema.RequiredMode.REQUIRED)
    BigDecimal holdingRatio,

    @Schema(description = "실시간 가격 지연 여부 (true면 평단가로 임시 계산됨)", example = "false", requiredMode = Schema.RequiredMode.REQUIRED)
    boolean isPriceStale
) {
}
