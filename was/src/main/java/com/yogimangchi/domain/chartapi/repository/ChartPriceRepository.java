package com.yogimangchi.domain.chartapi.repository;

import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class ChartPriceRepository {

    private final Map<String, ChartPriceDto> latestPrices = new ConcurrentHashMap<>();

    public void save(ChartPriceDto price) {
        latestPrices.put(price.symbol(), price);
    }

    public Optional<ChartPriceDto> findBySymbol(String symbol) {
        return Optional.ofNullable(latestPrices.get(symbol.toUpperCase()));
    }

    public List<ChartPriceDto> findAllBySymbols(List<String> symbols) {
        return symbols.stream()
                .map(String::toUpperCase)
                .map(latestPrices::get)
                .filter(price -> price != null)
                .toList();
    }
}
