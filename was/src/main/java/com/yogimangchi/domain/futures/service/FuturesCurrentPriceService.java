package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.chartapi.repository.FuturesPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FuturesCurrentPriceService {

    private final FuturesPriceRepository futuresPriceRepository;
    private final ChartPriceRepository chartPriceRepository;

    public BigDecimal getCurrentPrice(String symbol) {
        String upperSymbol = symbol.trim().toUpperCase();

        return findCurrentPrice(upperSymbol)
                .orElseThrow(() -> new IllegalArgumentException(
                        "현재 해당 코인의 선물 시세를 확인할 수 없습니다. symbol=" + upperSymbol
                        + " (futures ticker/mark cache miss)"
                ));
    }

    public Optional<BigDecimal> findCurrentPrice(String symbol) {
        String upperSymbol = symbol.trim().toUpperCase();

        Optional<String> tickerPrice = futuresPriceRepository.findTickerPriceBySymbol(upperSymbol);
        if (tickerPrice.isPresent()) {
            return tickerPrice.map(BigDecimal::new);
        }

        Optional<String> markPrice = futuresPriceRepository.findMarkPriceBySymbol(upperSymbol);
        if (markPrice.isPresent()) {
            log.warn("[선물 현재가 fallback] ticker cache miss, markPrice 사용 symbol={} price={}", upperSymbol, markPrice.get());
            return markPrice.map(BigDecimal::new);
        }

        return chartPriceRepository.findBySymbol(upperSymbol)
                .map(chartPrice -> {
                    log.warn("[선물 현재가 fallback] futures cache miss, chart price 사용 symbol={} price={}", upperSymbol, chartPrice.price());
                    return new BigDecimal(chartPrice.price());
                });
    }
}
