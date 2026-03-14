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
        // 1초마다 메모리에 저장된 최신 가격을 읽어서 로그로 출력합니다.
        // 주의: 바이낸스에 1초마다 REST 요청하는 것이 아니라,
        // 이미 웹소켓으로 받은 최신값을 읽는 것입니다.
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
