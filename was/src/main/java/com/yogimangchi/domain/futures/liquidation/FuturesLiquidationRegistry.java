package com.yogimangchi.domain.futures.liquidation;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 강제청산 감시 대상 심볼 관리 (인메모리)
 *
 * 전체 회원 기준으로 단 한 명이라도 해당 심볼의 OPEN 포지션을 보유 중이면
 *  * Registry에 등록되며, Coordinator가 해당 심볼의 틱을 처리한다.
 *  * 모든 포지션이 청산되어 보유자가 0명이 되면 Registry에서 제거된다.
 */

@Component
public class FuturesLiquidationRegistry {

    // 있냐/없냐만 알면 됨 = ConcurrentHashMap.newKeySet() (Set)
    // 몇 개인지 숫자도 알아야 함 = ConcurrentHashMap<K, AtomicInteger> (Map)

    // 심볼별 OPEN 포지션 보유자 수 (0이 되면 항목 자체를 제거한다), 포지션으로 존재하는 심볼 집합
    private final ConcurrentHashMap<String, AtomicInteger> holderCounts = new ConcurrentHashMap<>();

    // 심볼별 누적 가격 범위 저장소 (처리 중 들어오는 틱을 놓치지 않기 위해 누적)
    private final ConcurrentHashMap<String, LiquidationPriceWindow> priceWindows = new ConcurrentHashMap<>();

    // 현재 청산 처리 중인 심볼 집합 (중복 처리 방지)
    private final Set<String> processingSymbols = ConcurrentHashMap.newKeySet();

    // 포지션 오픈 시 호출 — 보유자 수 +1, 처음이면 Map에 새로 등록
    public void register(String symbol) {
        holderCounts
                .computeIfAbsent(normalize(symbol), k -> new AtomicInteger(0)) // "없으면(Absent) 계산해서(compute) 넣어라"
                .incrementAndGet(); // 반환된 AtomicInteger 객체에 "숫자 1 올리고(increment), 그 결과값을 가져와(get)", =  포지션을 잡은 사람이 생겼으니 카운트를 올리는 동작이죠.
    }

    // 포지션 청산 시 호출 — 보유자 수 -1, 0이 되면 Map에서 제거
    public void deregister(String symbol) {
        String key = normalize(symbol);
        holderCounts.computeIfPresent(key, (k, count) -> {
            return count.decrementAndGet() <= 0 ? null : count; // 1 감소 후 0이면 null 반환 → ConcurrentHashMap이 항목을 자동 제거
        });
    }

    // 해당 심볼에 감시 대상 포지션이 하나라도 있는지 확인
    public boolean isWatched(String symbol) {
        return holderCounts.containsKey(normalize(symbol));
    }

    // 현재 감시 중인 전체 심볼 목록 반환 ( Coordinator가 사용 )
    public List<String> getWatchedSymbols() {
        return holderCounts.keySet().stream().sorted().toList();
    }

    // 틱이 올 때마다 가격 범위 누적 — 처리 중에 들어오는 틱도 놓치지 않음
    public void updatePriceWindow(String symbol, BigDecimal price) {
        String key = normalize(symbol);
        priceWindows.compute(key, (k, current) ->
                current == null ? LiquidationPriceWindow.single(price) : current.merge(price)
        );
    }

    // 누적된 가격 범위를 꺼내고 제거 — Coordinator가 처리 시작 시 호출
    public LiquidationPriceWindow drainPriceWindow(String symbol) {
        return priceWindows.remove(normalize(symbol));
    }

    // 추가로 쌓인 가격 범위가 있는지 확인 — 처리 후 재진입 여부 판단용
    public boolean hasPendingPriceWindow(String symbol) {
        return priceWindows.containsKey(normalize(symbol));
    }

    // 동일 심볼 중복 처리 방지 — 처리 시작 시 마킹, 이미 처리 중이면 false 반환
    public boolean markProcessing(String symbol) {
        return processingSymbols.add(normalize(symbol));
    }

    // 처리 완료 후 마킹 해제 — finally에서 반드시 호출
    public void unmarkProcessing(String symbol) {
        processingSymbols.remove(normalize(symbol));
    }

    // 심볼 비교 일관성을 위한 정규화 (대문자, 공백 제거)
    private String normalize(String symbol) {
        return symbol.trim().toUpperCase();
    }
}
