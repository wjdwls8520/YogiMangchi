package com.yogimangchi.domain.chartapi.controller;

import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.chartapi.service.BinanceChartProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chartapi")
@RequiredArgsConstructor
public class ChartApiController {

    private final BinanceChartProperties binanceChartProperties;
    private final ChartPriceRepository chartPriceRepository;

    @GetMapping("/prices")
    public List<ChartPriceDto> getTrackedPrices() {
        return chartPriceRepository.findAllBySymbols(binanceChartProperties.getTrackedSymbols());
    }

    @GetMapping("/prices/{symbol}")
    public ResponseEntity<ChartPriceDto> getPrice(@PathVariable String symbol) {
        return chartPriceRepository.findBySymbol(symbol)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
