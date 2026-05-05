package com.yogimangchi.domain.chartapi.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BinanceFuturesStreamMessage {

    // stream = 어떤 채널에서 온 데이터인지
    // 예: "btcusdt@ticker"
    private String stream;

    // data = 실제 시세 데이터
    private StreamData data;

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true) // 추가 필수! (DTO에 없는 필드는 무시함)
    public static class StreamData {

        // 이벤트 타입 — "24hrTicker"
        @JsonProperty("e")
        private String eventType;

        // 이벤트 발생 시각
        @JsonProperty("E")
        private Long eventTime;

        // 심볼
        @JsonProperty("s")
        private String symbol;

        // 선물 최근 체결가 (@ticker 전용 필드)
        @JsonProperty("c")
        private String lastPrice;
    }
}
