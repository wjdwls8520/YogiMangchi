package com.yogimangchi.domain.market.dto.response;

import com.yogimangchi.domain.market.entity.MarketSymbol;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "거래 가능한 코인 메뉴판 응답 데이터")
public record MarketSymbolResponseDto (

    @Schema(description = "코인 심볼", example = "BTCUSDT")
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
){
    public static MarketSymbolResponseDto from(MarketSymbol symbol) {
        return new MarketSymbolResponseDto(
                symbol.getBaseAsset() + "USDT",
                symbol.getSymbol(),
                symbol.getDisplayNameKr(),
                symbol.getDisplayNameEn(),
                symbol.getBaseAsset(),
                symbol.getQuoteAsset()
        );
    }
}
