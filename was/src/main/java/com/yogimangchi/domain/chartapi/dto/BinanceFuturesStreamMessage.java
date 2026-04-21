package com.yogimangchi.domain.chartapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BinanceFuturesStreamMessage {

    // stream = 어떤 채널에서 온 데이터인지
    // 예: "btcusdt@ticker", "btcusdt@markPrice"
    private String stream;

    // data = 실제 시세 데이터
    private StreamData data;

    @Getter
    @NoArgsConstructor
    public static class StreamData {

        // 이벤트 타입 — "24hrTicker" 또는 "markPriceUpdate"
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

        // 마크 프라이스 (@markPrice 전용 필드, 청산 조건 판단 기준)
        @JsonProperty("p")
        private String markPrice;
    }
}
