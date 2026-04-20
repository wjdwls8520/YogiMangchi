package com.yogimangchi.domain.futures.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FuturesLeverageRequestDto(

        @Schema(description = "레버리지를 설정할 심볼", example = "BTCUSDT")
        @NotBlank
        String symbol,

        @Schema(description = "설정할 레버리지 배수 (최소 1배)", example = "10")
        @NotNull
        @Min(value = 1, message = "레버리지는 최소 1배 이상이어야 합니다.")
        Integer leverage
) {
}
