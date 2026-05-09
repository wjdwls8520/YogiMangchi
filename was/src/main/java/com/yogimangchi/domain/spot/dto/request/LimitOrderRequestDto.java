package com.yogimangchi.domain.spot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record LimitOrderRequestDto(

        @NotBlank(message = "코인 심볼은 필수입니다.")
        @Schema(description = "코인 심볼", example = "BTCUSDT")
        String symbol,

        @NotBlank(message = "매매 방향은 필수입니다.")
        @Schema(description = "매매 방향 (BUY: 매수, SELL: 매도)", example = "BUY")
        String side,

        @NotNull(message = "주문 가격은 필수입니다.")
        @Positive(message = "주문 가격은 0보다 커야 합니다.")
        @Schema(description = "지정가 주문 가격", example = "70000")
        BigDecimal price,

        @NotNull(message = "주문 수량은 필수입니다.")
        @Positive(message = "주문 수량은 0보다 커야 합니다.")
        @Schema(description = "주문 수량", example = "0.5")
        BigDecimal quantity

) {
}
