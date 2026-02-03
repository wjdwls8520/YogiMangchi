package com.yogimangchi.client.kis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class KisStockPriceResponseDto {

    @JsonProperty("output")
    private Output output;

    @Getter
    @ToString
    public static class Output {
        @JsonProperty("stck_prpr") // API가 주는 명칭(현재가)
        private String currentPrice;

        @JsonProperty("prdy_vrss") // 전일 대비
        private String changeAmount;

        @JsonProperty("prdy_ctrt") // 등락률
        private String changeRate;

        @JsonProperty("acml_vol") // 누적 거래량
        private String tradingVolume;
    }
}
