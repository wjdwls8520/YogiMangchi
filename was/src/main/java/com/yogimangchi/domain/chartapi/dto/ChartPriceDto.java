package com.yogimangchi.domain.chartapi.dto;

import java.time.Instant;

public record ChartPriceDto(
        String symbol,
        String price,
        Instant eventTime,
        Instant receivedAt
) {
}
