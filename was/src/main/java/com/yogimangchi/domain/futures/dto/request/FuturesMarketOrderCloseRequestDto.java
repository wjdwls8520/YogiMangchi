package com.yogimangchi.domain.futures.dto.request;

import com.yogimangchi.domain.futures.enums.PositionSide;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record FuturesMarketOrderCloseRequestDto(

        @Schema(description = "청산할 선물 종목 심볼", example = "BTCUSDT")
        @NotBlank
        String symbol,

        @Schema(description = "청산할 포지션 방향 (LONG: 롱, SHORT: 숏)", example = "LONG")
        @NotNull
        PositionSide positionSide,

        @Schema(description = "청산할 수량", example = "0.01")
        @NotNull
        @DecimalMin(value = "0.00000001")
        BigDecimal closeQuantity
) {
}
