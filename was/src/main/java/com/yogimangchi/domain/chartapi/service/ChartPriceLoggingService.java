package com.yogimangchi.domain.chartapi.service;

import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChartPriceLoggingService {

    private final BinanceChartProperties binanceChartProperties;
    private final ChartPriceRepository chartPriceRepository;

    @Scheduled(fixedRate = 1000)
    public void logTrackedPrices() {
        List<ChartPriceDto> prices = chartPriceRepository.findAllBySymbols(binanceChartProperties.getTrackedSymbols());

        if (prices.isEmpty()) {
            log.info("[BINANCE] 아직 수신된 시세가 없습니다. symbols={}", binanceChartProperties.getTrackedSymbols());
            return;
        }

        String logLine = prices.stream()
                .map(price -> price.symbol() + "=" + price.price())
                .reduce((left, right) -> left + ", " + right)
                .orElse("no-data");

        log.info("[BINANCE] {}", logLine);
    }
}
