package com.yogimangchi.domain.futures.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record FuturesLeverageResponseDto(

        @Schema(description = "심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "현재 설정된 레버리지 배수", example = "10")
        int leverage,

        @Schema(description = "이 지갑 타입에서 이 심볼에 허용되는 최대 레버리지 배수", example = "100")
        int maxLeverage
) {
}
