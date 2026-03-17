package com.yogimangchi.domain.chartapi.controller;

import com.yogimangchi.domain.chartapi.dto.CandleDto;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.chartapi.service.BinanceChartApiService;
import com.yogimangchi.domain.chartapi.service.BinanceChartProperties;
import com.yogimangchi.domain.chartapi.service.ChartApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chartapi")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ChartApiController {

    private final BinanceChartProperties binanceChartProperties;
    private final ChartPriceRepository chartPriceRepository;
    private final ChartApiService ChartApiService;

    @GetMapping("/prices")
    public List<ChartPriceDto> getTrackedPrices() {
        // application.yml에 적어둔 trackedSymbols 목록의 최신 가격을 모두 반환합니다.
        return chartPriceRepository.findAllBySymbols(binanceChartProperties.getTrackedSymbols());
    }

    @GetMapping("/prices/{symbol}")
    public ResponseEntity<ChartPriceDto> getPrice(@PathVariable String symbol) {
        // 특정 종목 1개의 최신 가격을 반환합니다.
        // 예: /api/chartapi/prices/BTCUSDT
        return chartPriceRepository.findBySymbol(symbol)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/candles/{symbol}")
    public ResponseEntity<List<CandleDto>> getCandles(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "15m") String interval,
            @RequestParam(defaultValue = "100") int limit) {
        List<CandleDto> candles = ChartApiService.getPastCandles(symbol, interval, limit);
        return ResponseEntity.ok(candles);
    }

}
