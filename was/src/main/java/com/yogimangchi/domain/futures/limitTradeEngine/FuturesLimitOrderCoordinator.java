package com.yogimangchi.domain.futures.limitTradeEngine;

import com.yogimangchi.domain.futures.limitorder.FuturesLimitOrderExecutionService;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.service.FuturesCurrentPriceService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

@Slf4j
@Component
@RequiredArgsConstructor
public class FuturesLimitOrderCoordinator {

    // 심볼별 한 번에 조회할 체결 후보 최대 개수 (현물과 동일)
    private static final int MATCH_BATCH_SIZE = 100;

    private final FuturesLimitOrderRegistry limitOrderRegistry;
    private final FuturesOrderRepository futuresOrderRepository;
    private final FuturesCurrentPriceService futuresCurrentPriceService;
    private final FuturesLimitOrderExecutionService limitOrderExecutionService;

    // 심볼별 체결 처리를 병렬로 담당하는 스레드풀 (최대 4개 심볼 동시 처리)
    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    // BinanceFuturesApiService 에서 ticker 틱마다 호출 - 가격 누적 및 체결 트리거
    public void onPriceTick(String symbol, BigDecimal price) {
        // 처리 중 들어오는 틱도 좋치지 않도록 윈도우에 누적
        limitOrderRegistry.updatePriceWindow(symbol, price);
        // 감시 대상이 아니면 즉시 return - DB 조회 없음
        if(!limitOrderRegistry.isWatched(symbol)) {
            return;
        }
        tryProcess(symbol);
    }

    // 스케쥴러 fallback 재평가 진입점 - 틱 기반 처리와 동일한 경로를 탐
    public void requestReplay(String symbol) {
        if(!limitOrderRegistry.isWatched(symbol)) {
            return;
        }
        tryProcess(symbol);
    }

    // 동일 심볼 중복 처리 방지 게이트 - 통과하면 스레드풀에 비동기 위임
    private void tryProcess(String symbol) {
        // markProcessing()이 false면 이미 처리 중인 스레드가 있음 → 즉시 return (윈도우엔 계속 누적)
        if (!limitOrderRegistry.markProcessing(symbol)) {
            return;
        }
        // WebSocket 스레드를 블로킹하지 않도록 스레드풀에 위임
        executorService.submit(() -> processSymbol(symbol));
    }

    // 실제 체결 판단 및 실행 — 스레드풀 내부에서 실행
    private void processSymbol(String symbol) {
        try {
            while (true) {
                // 누적된 가격 범위 꺼냄
                FuturesLimitOrderPriceWindow priceWindow = limitOrderRegistry.drainPriceWindow(symbol);

                if (priceWindow == null) {
                    // 틱 누락 시 최근 조회 가능한 선물 현재가로 보정
                    BigDecimal latest = futuresCurrentPriceService.findCurrentPrice(symbol).orElse(null);
                    if (latest == null) {
                        break; // 보정할 가격도 없으면 다음 틱 또는 스케줄러 재진입 대기
                    }
                    priceWindow = FuturesLimitOrderPriceWindow.single(latest);
                }

                // 가격 범위 조건으로 체결 대상 ID만 DB에서 인덱스 시크 조회
                // (전체 엔티티 로드 없이 ID만 — 메모리/GC 부담 최소화)
                List<Long> triggeredIds = findExecutableOrderIds(symbol, priceWindow);

                // 주문별 독립 트랜잭션으로 체결 — 하나 실패해도 나머지 계속 처리
                for (Long orderId : triggeredIds) {
                    try {
                        limitOrderExecutionService.executeLimitOrder(orderId);
                    } catch (Exception e) {
                        log.error("[지정가 체결 실패] symbol={}, orderId={}, message={}",
                                symbol, orderId, e.getMessage(), e);
                    }
                }

                // 감시 심볼 없거나 추가 가격 범위 없으면 루프 종료
                if (!limitOrderRegistry.isWatched(symbol) || !limitOrderRegistry.hasPendingPriceWindow(symbol)) {
                    break;
                }
            }
        } catch (Exception e) {
            log.error("[지정가 Coordinator 오류] symbol={}, message={}", symbol, e.getMessage(), e);
        } finally {
            // 반드시 해제 — 해제 안 하면 이 심볼 영구 처리 불가
            limitOrderRegistry.unmarkProcessing(symbol);
            // 처리 중 새로 쌓인 가격 범위가 있으면 재진입
            if (limitOrderRegistry.isWatched(symbol) && limitOrderRegistry.hasPendingPriceWindow(symbol)) {
                tryProcess(symbol);
            }
        }
    }

    // 체결 대상 주문 ID 조회 — 4가지 트리거 조건을 두 개의 인덱스 쿼리로 통합
    // 하한 트리거 (가격 하락 → 체결): LONG OPEN ∪ SHORT CLOSE — orderPrice >= minPrice
    // 상한 트리거 (가격 상승 → 체결): SHORT OPEN ∪ LONG CLOSE — orderPrice <= maxPrice
    private List<Long> findExecutableOrderIds(String symbol, FuturesLimitOrderPriceWindow window) {
        List<Long> lower = futuresOrderRepository.findExecutableLowerTriggerOrderIds(
                symbol, window.minPrice(), MATCH_BATCH_SIZE
        );
        List<Long> upper = futuresOrderRepository.findExecutableUpperTriggerOrderIds(
                symbol, window.maxPrice(), MATCH_BATCH_SIZE
        );

        // 주문 등록 순서 보장 — ID 오름차순 정렬
        return Stream.concat(lower.stream(), upper.stream())
                .sorted()
                .toList();
    }

    // 서버 종료 시 스레드풀 정리 — graceful shutdown 보장
    @PreDestroy
    public void shutdown() {
        executorService.shutdown();
    }

}
