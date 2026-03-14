package com.yogimangchi.domain.chartapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BinanceTickerStreamMessage {

    // stream = 우리가 어떤 채널을 구독했는지 알려주는 이름
    // 예: btcusdt@ticker
    private String stream;

    // data = 바이낸스가 실제로 보내준 시세 데이터 본문
    private TickerData data;

    @Getter
    @NoArgsConstructor
    public static class TickerData {

        // s(symbol) = 종목 이름
        @JsonProperty("s")
        private String symbol;

        // c(close price) = 현재 마지막 체결 가격
        @JsonProperty("c")
        private String lastPrice;

        // E(event time) = 바이낸스에서 이 데이터가 만들어진 시간
        @JsonProperty("E")
        private Long eventTime;
    }
}
