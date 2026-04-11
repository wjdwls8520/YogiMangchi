package com.yogimangchi.domain.spot.matching;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
// 지정가 주문 매칭 상태를 관리하는 컴포넌트
public class LimitOrderSignalRegistry {

    // 미체결 지정가 주문이 존재하는 심볼 집합
    private final Set<String> openLimitOrderSymbols = ConcurrentHashMap.newKeySet();
    // 현재 매칭 처리 중인 심볼 집합
    private final Set<String> processingSymbols = ConcurrentHashMap.newKeySet();
    // 심볼별 누적 가격 범위 저장소
    private final Map<String, PriceWindow> priceWindows = new ConcurrentHashMap<>();

    public void registerOpenSymbol(String symbol) {
        openLimitOrderSymbols.add(normalize(symbol));
    }

    // 심볼에 미체결 주문이 있는지 상태를 동기화한다.
    public void syncOpenSymbol(String symbol, boolean hasOpenOrder) {
        String normalizedSymbol = normalize(symbol);

        if (hasOpenOrder) {
            openLimitOrderSymbols.add(normalizedSymbol);
            return;
        }

        openLimitOrderSymbols.remove(normalizedSymbol);
    }

    public boolean hasOpenLimitOrder(String symbol) {
        return openLimitOrderSymbols.contains(normalize(symbol));
    }

    public List<String> getOpenSymbols() {
        return openLimitOrderSymbols.stream().sorted().toList();
    }

    // 가격 구간 누적을 위해 가격 범위를 병합한다.
    public void updatePriceWindow(String symbol, BigDecimal price) {
        String normalizedSymbol = normalize(symbol);
        priceWindows.compute(normalizedSymbol, (key, currentWindow) ->
                currentWindow == null ? PriceWindow.single(price) : currentWindow.merge(price)
        );
    }

    // 처리 대상 가격 범위를 꺼내고 제거한다.
    public PriceWindow drainPriceWindow(String symbol) {
        return priceWindows.remove(normalize(symbol));
    }

    public boolean hasPendingPriceWindow(String symbol) {
        return priceWindows.containsKey(normalize(symbol));
    }

    // 동일 심볼의 중복 처리를 막기 위해 마킹한다.
    public boolean markProcessing(String symbol) {
        return processingSymbols.add(normalize(symbol));
    }

    public void unmarkProcessing(String symbol) {
        processingSymbols.remove(normalize(symbol));
    }

    // 심볼 비교 일관성을 위한 정규화
    private String normalize(String symbol) {
        return symbol.trim().toUpperCase();
    }
}
