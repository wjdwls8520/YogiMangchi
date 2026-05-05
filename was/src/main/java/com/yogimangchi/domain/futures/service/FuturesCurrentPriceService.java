package com.yogimangchi.domain.futures.service;

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

    // 선물 @ticker 현재가 조회 — 캐시에 없으면 예외 (WebSocket 미연결 상태에서는 주문 불가)
    public BigDecimal getCurrentPrice(String symbol) {
        String upperSymbol = symbol.trim().toUpperCase();

        return findCurrentPrice(upperSymbol)
                .orElseThrow(() -> new IllegalArgumentException(
                        "현재 해당 코인의 선물 시세를 확인할 수 없습니다. symbol=" + upperSymbol
                        + " (futures ticker cache miss)"
                ));
    }

    // 선물 @ticker 캐시에서만 조회 — 현물 차트 가격은 절대 사용하지 않음
    public Optional<BigDecimal> findCurrentPrice(String symbol) {
        String upperSymbol = symbol.trim().toUpperCase();

        return futuresPriceRepository.findTickerPriceBySymbol(upperSymbol)
                .map(BigDecimal::new);
    }
}
