package com.yogimangchi.domain.trade.matching;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
// 지정가 주문 매칭 상태 관리 컴포넌트
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

    // 심볼에 미체결 주문이 있는지 감시
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

    // 틱 구간 누적을 위한 가격 범위 병합
    public void updatePriceWindow(String symbol, BigDecimal price) {
        String normalizedSymbol = normalize(symbol);
        priceWindows.compute(normalizedSymbol, (key, currentWindow) ->
                currentWindow == null ? PriceWindow.single(price) : currentWindow.merge(price)
        );
    }

    // 처리 대상 가격 범위 일괄 소진
    public PriceWindow drainPriceWindow(String symbol) {
        return priceWindows.remove(normalize(symbol));
    }

    public boolean hasPendingPriceWindow(String symbol) {
        return priceWindows.containsKey(normalize(symbol));
    }

    // 동일 심볼 중복 처리 방지 마킹
    public boolean markProcessing(String symbol) {
        return processingSymbols.add(normalize(symbol));
    }

    public void unmarkProcessing(String symbol) {
        processingSymbols.remove(normalize(symbol));
    }

    // 심볼 비교 일관성 확보용 정규화
    private String normalize(String symbol) {
        return symbol.trim().toUpperCase();
    }
}
