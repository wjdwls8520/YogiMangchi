package com.yogimangchi.domain.market.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record MarketFuturesSymbolResponseDto (
        @Schema(description = "코인 심볼", example = "BTCYD")
        String binanceRequestSymbol,

        @Schema(description = "코인 심볼", example = "BTCYD")
        String symbol,

        @Schema(description = "한글 이름", example = "비트코인")
        String displayNameKr,

        @Schema(description = "영어 이름", example = "Bitcoin")
        String displayNameEn,

        @Schema(description = "기초 자산", example = "BTC")
        String baseAsset,

        @Schema(description = "결제 자산", example = "YD")
        String quoteAsset
) {}
