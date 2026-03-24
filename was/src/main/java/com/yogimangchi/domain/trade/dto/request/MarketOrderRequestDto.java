package com.yogimangchi.domain.trade.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

public record MarketOrderRequestDto(

        @Schema(description = "코인 심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "매매를 진행할 지갑 타입 (SPOT: 현물, FUTURE: 선물, CONTEST: 대회)", example = "SPOT")
        AssetType assetType,

        @Schema(description = "매매 방향 (BUY: 매수, SELL: 매도)", example = "BUY")
        String side,

        @Schema(description = "매도(SELL) 시: 팔고자 하는 코인 수량", example = "0.5")
        BigDecimal quantity,

        @Schema(description = "매수(BUY) 시: 사용할 현금 금액", example = "100000")
        BigDecimal totalAmount

){}

