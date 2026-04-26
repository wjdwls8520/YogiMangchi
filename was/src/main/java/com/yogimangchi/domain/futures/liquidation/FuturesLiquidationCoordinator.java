package com.yogimangchi.domain.futures.liquidation;

import com.yogimangchi.domain.chartapi.repository.FuturesPriceRepository;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 파일명 해석
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Futures    : 선물
 *  Liquidation: 강제청산
 *  Coordinator: 조정자 / 조율자
 *               → 여러 컴포넌트(Registry, ExecutionService 등)를 조율하는 중간 관리자
 *               → 직접 DB를 건드리거나 비즈니스 로직을 처리하지 않고,
 *                  "누가 언제 무엇을 해야 하는지"를 판단하고 위임하는 역할
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 역할
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  BinanceChartApiService 에서 틱이 들어오면 이 클래스의 onPriceTick() 이 호출된다.
 *  Registry를 통해 해당 심볼에 감시 대상 포지션이 있는지 확인하고,
 *  있으면 비동기 스레드풀에 강제청산 처리를 위임한다.
 *
 *  LimitOrderMatchCoordinator(현물 지정가 체결)와 동일한 구조이며, 강제청산 전용이다.
 *
 * 처리 흐름
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  1. onPriceTick(symbol, price) 수신
 *      → Registry에 가격 범위 누적 (updatePriceWindow)
 *      → 해당 심볼에 OPEN 포지션이 없으면 즉시 return (불필요한 처리 방지)
 *      → 있으면 tryProcess(symbol) 호출
 *
 *  2. tryProcess(symbol)
 *      → Registry에서 markProcessing() 으로 중복 처리 방지 게이트 확인
 *      → 이미 처리 중인 심볼이면 즉시 return (동시에 2개 스레드가 같은 심볼 처리 방지)
 *      → 통과하면 ExecutorService 스레드풀에 processSymbol() 비동기 위임
 *
 *  3. processSymbol(symbol) — 스레드풀 내부에서 실행
 *      → Registry에서 drainPriceWindow() 로 누적 가격 범위 꺼냄
 *      → 범위가 없으면 ChartPriceRepository에서 최신 저장가로 보정 (틱 누락 방어)
 *      → DB에서 해당 심볼의 OPEN 포지션 목록 조회
 *      → 각 포지션의 liquidationPrice 와 가격 범위를 비교
 *          LONG  포지션: minPrice <= liquidationPrice 이면 강제청산 트리거
 *          SHORT 포지션: maxPrice >= liquidationPrice 이면 강제청산 트리거
 *      → 트리거된 포지션 ID 목록을 FuturesLiquidationExecutionService 에 위임
 *      → 처리 후 Registry 동기화 (남은 OPEN 포지션 있는지 재확인)
 *      → 추가로 쌓인 가격 범위가 있으면 반복 처리 (루프)
 *      → finally 에서 반드시 unmarkProcessing() 호출
 *
 *  4. requestReplay(symbol) — 스케줄러 fallback 진입 지점
 *      → tryProcess(symbol)를 그대로 호출
 *      → 틱 기반 처리와 완전히 동일한 경로를 탐
 *
 * 주의사항
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  - ExecutorService는 @PreDestroy 에서 반드시 shutdown() 해야 함
 *    (서버 종료 시 스레드 풀이 남아있으면 graceful shutdown이 안 됨)
 *  - processSymbol() 내부의 각 포지션 처리는 try-catch 로 감싸야 함
 *    (하나의 포지션 처리 실패가 나머지 포지션 처리를 막으면 안 됨)
 *  - FuturesLiquidationExecutionService 는 별도 @Transactional 메서드로 각 포지션을 독립 처리
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FuturesLiquidationCoordinator {

    // 구현 예정
    // ExecutorService executorService = Executors.newFixedThreadPool(4)
    //   → 심볼별 강제청산 작업을 비동기로 처리하는 스레드풀
    //   → 4개 스레드 = 동시에 최대 4개 심볼을 병렬 처리 가능

    private final FuturesLiquidationRegistry liquidationRegistry; // 감시 중인 심볼 관리 — isWatched, markProcessing, priceWindow 등 인메모리 상태 담당
    private final FuturesPositionRepository futuresPositionRepository; // DB에서 OPEN 포지션 목록 조회 — 청산가 비교 대상 포지션을 가져올 때 사용
    private final FuturesPriceRepository futuresPriceRepository;  // 마지막으로 저장된 마크프라이스 조회 — WebSocket 재연결 중 틱 누락 시 보정용
    private final FuturesLiquidationExecutionService liquidationExecutionService;  // 실제 청산 실행 — 포지션/지갑 락 획득 후 정산금액 계산 및 상태 변경 담당

    // 심볼별 강제청산을 병렬 처리하는 스레드풀 (최대 4개 심볼 동시 처리)
    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    // BinanceFuturesApiService에서 마크프라이스 틱마다 호출 — 가격 누적 및 처리 트리거
    public void onPriceTick(String symbol, BigDecimal price) {
        // 처리 중에 들어오는 틱도 놓치지 않도록 윈도우에 누적
        liquidationRegistry.updatePriceWindow(symbol, price);

        // 감시 대상이 아니면 즉시 return (DB 조회 없음)
        if (!liquidationRegistry.isWatched(symbol)) {
            return;
        }
        tryProcess(symbol);
    }

    // 스케줄러 보험용 재평가 진입점 — 틱 기반 처리와 동일한 경로를 탐
    public void requestReplay(String symbol) {
        if (!liquidationRegistry.isWatched(symbol)) {
            return;
        }
        tryProcess(symbol);
    }

    // 동일 심볼 중복 처리 방지 게이트 — 통과하면 스레드풀에 비동기로 위임
    private void tryProcess(String symbol) {
        // 이미 처리 중이면 즉시 return (윈도우에는 계속 가격이 쌓임)
        if (!liquidationRegistry.markProcessing(symbol)) {
            return;
        }
        // WebSocket 스레드를 블로킹하지 않도록 스레드풀에 위임
        executorService.submit(() -> processSymbol(symbol));
    }

    // 실제 청산 판단 및 실행 — 스레드풀 내부에서 실행
    private void processSymbol(String symbol) {
        try {
            while (true) {
                // 누적된 가격 범위 꺼냄
                LiquidationPriceWindow priceWindow = liquidationRegistry.drainPriceWindow(symbol);

                if (priceWindow == null) {
                    // 틱 누락 시 마지막 저장된 마크프라이스로 보정 (WebSocket 재연결 중 방어)
                    String latest = futuresPriceRepository.findMarkPriceBySymbol(symbol).orElse(null);
                    if (latest == null) {
                        // 보정할 가격도 없으면 처리 불가 — 다음 틱 또는 스케줄러 재진입 대기
                        break;
                    }
                    priceWindow = LiquidationPriceWindow.single(new BigDecimal(latest));
                }

                // DB에서 이 심볼의 OPEN 포지션 전체 조회
                List<FuturesPosition> openPositions = futuresPositionRepository.findAllOpenBySymbol(symbol);

                final LiquidationPriceWindow window = priceWindow;
                // 청산 조건에 해당하는 포지션 ID 수집
                // LONG  : 최저가 <= 청산가 (가격이 청산가 아래로 내려옴)
                // SHORT : 최고가 >= 청산가 (가격이 청산가 위로 올라옴)
                List<Long> triggeredIds = openPositions.stream()
                        .filter(p -> isLiquidationTriggered(p, window))
                        .map(FuturesPosition::getId)
                        .toList();

                // 포지션별 독립 트랜잭션으로 청산 — 하나 실패해도 나머지 계속 처리
                for (Long positionId : triggeredIds) {
                    try {
                        liquidationExecutionService.executeLiquidation(positionId, window.latestPrice());
                    } catch (Exception e) {
                        log.error("[강제청산 실패] symbol={}, positionId={}, message={}",
                                symbol, positionId, e.getMessage(), e);
                    }
                }

                // 감시 심볼 없거나 추가 가격 범위 없으면 루프 종료
                if (!liquidationRegistry.isWatched(symbol) || !liquidationRegistry.hasPendingPriceWindow(symbol)) {
                    break;
                }
            }
        } catch (Exception e) {
            log.error("[강제청산 Coordinator 오류] symbol={}, message={}", symbol, e.getMessage(), e);
        } finally {
            // 반드시 해제 — 해제 안 하면 이 심볼 영구적으로 처리 불가
            liquidationRegistry.unmarkProcessing(symbol);

            // 처리 중 새로 쌓인 가격 범위가 있으면 재진입
            if (liquidationRegistry.isWatched(symbol) && liquidationRegistry.hasPendingPriceWindow(symbol)) {
                tryProcess(symbol);
            }
        }
    }

    // 청산 트리거 조건 판단
    private boolean isLiquidationTriggered(FuturesPosition position, LiquidationPriceWindow window) {
        BigDecimal liquidationPrice = position.getLiquidationPrice();
        if (liquidationPrice == null) {
            return false;
        }
        if (position.getPositionSide() == PositionSide.LONG) {
            // LONG: 최저가가 청산가 이하로 내려오면 청산
            return window.minPrice().compareTo(liquidationPrice) <= 0;
        } else {
            // SHORT: 최고가가 청산가 이상으로 올라오면 청산
            return window.maxPrice().compareTo(liquidationPrice) >= 0;
        }
    }

    // 서버 종료 시 스레드풀 정리 (graceful shutdown 보장)
    @PreDestroy
    public void shutdown() {
        executorService.shutdown();
    }

}
