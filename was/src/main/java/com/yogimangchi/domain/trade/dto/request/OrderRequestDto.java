package com.yogimangchi.domain.trade.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

public record OrderRequestDto(

        @Schema(description = "코인 심볼", example = "BTCUSDT")
        String symbol,

        @Schema(description = "주문 타입 (MARKET: 시장가, LIMIT: 지정가)", example = "MARKET")
        String orderType,

        @Schema(description = "매매 방향 (BUY: 매수, SELL: 매도)", example = "BUY")
        String side,

        @Schema(description = "지정가(LIMIT) 주문 시 희망 체결 단가 (시장가(MARKET) 주문 시에는 무시됨)", example = "65000")
        BigDecimal price,

        @Schema(description = "매도(SELL) 시: 팔고자 하는 코인 수량", example = "0.5")
        BigDecimal quantity,

        @Schema(description = "매수(BUY) 시: 사용할 현금 금액", example = "100000")
        BigDecimal totalAmount

){}

