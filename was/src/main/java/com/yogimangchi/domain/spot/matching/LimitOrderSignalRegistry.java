package com.yogimangchi.domain.spot.matching;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

@Component
// 지정가 주문 매칭 상태를 관리하는 컴포넌트
public class LimitOrderSignalRegistry {

    // 심볼별 미체결 지정가 주문 개수 관리 (카운트가 0이 되면 감시 대상에서 제외)
    private final Map<String, AtomicInteger> openOrderCounts = new ConcurrentHashMap<>();
    // 현재 매칭 처리 중인 심볼 집합
    private final Set<String> processingSymbols = ConcurrentHashMap.newKeySet();
    // 심볼별 누적 가격 범위 저장소
    private final Map<String, PriceWindow> priceWindows = new ConcurrentHashMap<>();

    // 지정가 주문 카운트 증가
    public void incrementOpenOrder(String symbol) {
        openOrderCounts.computeIfAbsent(normalize(symbol), k -> new AtomicInteger(0))
                .incrementAndGet();
    }

    // 지정가 주문 카운트 감소 (0이 되면 맵에서 제거)
    public void decrementOpenOrder(String symbol) {
        String normalizedSymbol = normalize(symbol);
        openOrderCounts.computeIfPresent(normalizedSymbol, (key, count) ->
                count.decrementAndGet() <= 0 ? null : count
        );
    }

    // 지정가 주문 카운트 일괄 감소 (0이 되면 맵에서 제거)
    public void decrementOpenOrder(String symbol, int amount) {
        if (amount <= 0) {
            return;
        }
        String normalizedSymbol = normalize(symbol);
        openOrderCounts.computeIfPresent(normalizedSymbol, (key, count) -> {
            int remaining = count.addAndGet(-amount);
            return remaining <= 0 ? null : count;
        });
    }

    // 서버 기동 시 초기 카운트 설정
    public void initializeCounts(Map<String, Long> counts) {
        counts.forEach((symbol, count) ->
                openOrderCounts.put(normalize(symbol), new AtomicInteger(count.intValue()))
        );
    }

    public boolean hasOpenLimitOrder(String symbol) {
        AtomicInteger count = openOrderCounts.get(normalize(symbol));
        return count != null && count.get() > 0;
    }

    public List<String> getOpenSymbols() {
        return openOrderCounts.keySet().stream().sorted().toList();
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
