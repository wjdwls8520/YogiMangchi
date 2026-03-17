package com.yogimangchi.domain.chartapi.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString
public class CandleDto {
    private Long time;      // 캔들 기준 시간
    private Double open;    // 시가
    private Double high;    // 고가
    private Double low;     // 저가
    private Double close;   // 종가
    private Double volume;  // 거래량
}
