package com.yogimangchi.domain.chartapi.repository;

import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class FuturesPriceRepository {

    // 선물 최근 체결가 — 주문 체결 및 강제청산 판단 기준가로 사용 (선물 @ticker 스트림)
    private final ConcurrentHashMap<String, String> tickerPrices = new ConcurrentHashMap<>();

    public void saveTickerPrice(String symbol, String price) {
        tickerPrices.put(symbol.toUpperCase(), price);
    }

    public Optional<String> findTickerPriceBySymbol(String symbol) {
        return Optional.ofNullable(tickerPrices.get(symbol.toUpperCase()));
    }
}
