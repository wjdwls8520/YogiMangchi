package com.yogimangchi.domain.chartapi.dto;

import java.time.Instant;

public record ChartPriceDto(
        // 종목 코드
        String symbol,

        // 현재 가격
        String price,

        // 바이낸스가 이 가격 이벤트를 만든 시간
        Instant eventTime,

        // 우리 서버가 이 가격을 실제로 받은 시간
        Instant receivedAt
) {
}
