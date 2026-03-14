package com.yogimangchi.domain.chartapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BinanceTickerStreamMessage {

    private String stream;
    private TickerData data;

    @Getter
    @NoArgsConstructor
    public static class TickerData {

        @JsonProperty("s")
        private String symbol;

        @JsonProperty("c")
        private String lastPrice;

        @JsonProperty("E")
        private Long eventTime;
    }
}
