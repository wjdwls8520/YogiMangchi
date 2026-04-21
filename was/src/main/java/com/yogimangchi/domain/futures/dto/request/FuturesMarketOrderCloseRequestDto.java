package com.yogimangchi.domain.futures.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record FuturesMarketOrderCloseRequestDto(

        @Schema(description = "청산할 포지션 ID", example = "1")
        @NotNull
        Long positionId,

        @Schema(description = "청산할 수량", example = "0.01")
        @NotNull
        @DecimalMin(value = "0.00000001")
        BigDecimal closeQuantity
) {
}
