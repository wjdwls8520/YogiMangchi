package com.yogimangchi.domain.futures.limitTradeEngine;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class FuturesLimitOrderRegistry {

    // 심볼별 PENDING 주문 수 (0이 되면 항목 자체 제거 → 감시 해제)
    private final ConcurrentHashMap<String, AtomicInteger> holderCounts = new ConcurrentHashMap<>();

    // 심볼별 누적 가격 범위 (체결 처리 중 들어오는 틱도 손실 없이 기록)
    private final ConcurrentHashMap<String, FuturesLimitOrderPriceWindow> priceWindows = new ConcurrentHashMap<>();

    // 현재 체결 처리 중인 심볼 집합 (동일 심볼 중복 처리 방지)
    private final Set<String> processingSymbols = ConcurrentHashMap.newKeySet();

    // 지정가 주문 등록 시 호출 — 보유자 수 +1
    public void register(String symbol) {
        holderCounts
                .computeIfAbsent(normalize(symbol), k -> new AtomicInteger(0))
                .incrementAndGet();
    }

    // Bootstrap 전용 — 서버 재시작 시 심볼별 PENDING 카운트 일괄 복원
    // (개별 register 반복 호출 대신 한 번에 누적, count <= 0 이면 무시)
    public void registerCount(String symbol, int count) {
        if (count <= 0) {
            return;
        }
        holderCounts
                .computeIfAbsent(normalize(symbol), k -> new AtomicInteger(0))
                .addAndGet(count);
    }

    // 지정가 주문 체결/취소 시 호출 — 보유자 수 -1, 0이 되면 항목 제거
    public void deregister(String symbol) {
        String key = normalize(symbol);
        holderCounts.computeIfPresent(key, (k, count) ->
                count.decrementAndGet() <= 0 ? null : count
        );
    }

    // 해당 심볼에 PENDING 주문이 하나라도 있는지 확인
    public boolean isWatched(String symbol) {
        return holderCounts.containsKey(normalize(symbol));
    }

    // 감시 중인 전체 심볼 목록 반환 (Coordinator / Scheduler 사용)
    public List<String> getWatchedSymbols() {
        return holderCounts.keySet().stream().sorted().toList();
    }

    // 틱이 올 때마다 가격 범위 누적
    public void updatePriceWindow(String symbol, BigDecimal price) {
        String key = normalize(symbol);
        priceWindows.compute(key, (k, current) ->
                current == null ? FuturesLimitOrderPriceWindow.single(price) : current.merge(price)
        );
    }

    // 누적된 가격 범위 꺼내고 제거 - Coordinator 처리 시작 시 호출
    public FuturesLimitOrderPriceWindow drainPriceWindow(String symbol) {
        return priceWindows.remove(normalize(symbol));
    }

    // 처리 후 추가로 쌓인 가격 범위가 있는지 확인 — 루프 재진입 판단용
    public boolean hasPendingPriceWindow(String symbol) {
        return priceWindows.containsKey(normalize(symbol));
    }

    // 중복 처리 방지 게이트 - 처리 시작 시 true 반환, 이미 처리 중이면 false
    public boolean markProcessing(String symbol) {
        return processingSymbols.add(normalize(symbol));
    }

    // 처리 완료 후 게이트 해제 - finally 에서 반드시 호출
    public void unmarkProcessing(String symbol) {
        processingSymbols.remove(normalize(symbol));
    }

    private String normalize(String symbol) {
        return symbol.trim().toUpperCase();
    }

}
