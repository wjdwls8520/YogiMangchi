package com.yogimangchi.domain.futures.liquidation;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.*;

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 파일명 해석
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Futures    : 선물
 *  Liquidation: 강제청산
 *  Scheduler  : 일정 관리자 / 주기 실행자
 *               → 일정 시간 간격마다 정해진 작업을 반복 실행하는 역할
 *               → 틱 기반 처리(Coordinator)가 메인이고, 이 스케줄러는 보조(fallback)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 역할
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Binance WebSocket 틱 기반 처리(FuturesLiquidationCoordinator.onPriceTick)가 메인이지만,
 *  아래 상황에서는 틱이 오지 않거나 처리가 누락될 수 있다:
 *    - WebSocket 연결이 일시적으로 끊긴 직후 재연결 중인 순간
 *    - 틱이 갑자기 몰리거나 드롭되는 네트워크 이슈
 *
 *  이 스케줄러는 1초마다 Registry에 등록된 모든 심볼을 순회하며
 *  Coordinator.requestReplay() 를 호출해 강제청산을 재평가한다.
 *  틱이 정상적으로 오고 있다면 Coordinator 내부의 중복처리 게이트(markProcessing)에 의해
 *  즉시 return 되므로 실제 추가 부담은 거의 없다.
 *
 *  LimitOrderScheduler(현물 지정가 보조 스케줄러)와 동일한 구조이며, 강제청산 전용이다.
 *
 * 처리 흐름
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  1. refreshSchedule()
 *      → 포지션 진입 주문이 체결될 때 호출됨 (FuturesLiquidationBootstrapService 또는 OrderService에서 호출)
 *      → Registry에 감시 심볼이 있으면 스케줄 태스크를 시작
 *      → 이미 실행 중이면 중복 시작 방지
 *
 *  2. replayOpenSymbols() — 1초마다 반복 실행
 *      → Registry에서 감시 중인 심볼 목록을 가져옴
 *      → 각 심볼에 대해 Coordinator.requestReplay(symbol) 호출
 *      → 심볼이 하나도 없으면 스케줄 중지 (stopIfIdle)
 *
 *  3. stopIfIdle()
 *      → 모든 포지션이 청산되어 감시할 심볼이 없으면 스케줄러 태스크를 중지
 *      → 불필요한 리소스 점유 방지
 *
 * 주의사항
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  - ScheduledExecutorService 는 단일 스레드(newSingleThreadScheduledExecutor)로 충분
 *    (실제 처리는 Coordinator의 스레드풀(  스레드 풀:미리 스레드 4개 생성해 놓음  )이 담당하므로 스케줄러는 트리거만 하면 됨) .
                                                                     *    CPU 스레드 vs 소프트웨어 스레드
                                                                     *
                                                                     *   하드웨어 (CPU)          운영체제(OS)              Java
                                                                     *    프로그램
                                                                     *
                                                                     *   8코어 16스레드   →   OS 스레드 수백 개   →   Java 스레드 수십 개
                                                                     *     (물리적 고정)        (소프트웨어 추상화)     (우리가 만드는 것)
                                                                     *   컨텍스트 스위칭 : 스레드가 여러일을 나누어서 작업할 때, 스위칭하는 것
 * - @PreDestroy 에서 반드시 shutdown() 호출
 *  - refreshSchedule() 과 stopIfIdle() 은 synchronized 처리 필요
 *    (여러 스레드에서 동시에 호출될 수 있으므로)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FuturesLiquidationScheduler {

    // 1초마다 보험용 재평가 실행
    private static final long REPLAY_INTERVAL_MILLIS = 1000L;

    private final FuturesLiquidationRegistry liquidationRegistry; // 감시 중인 심볼 목록을 조회하기 위한 Registry
    private final FuturesLiquidationCoordinator liquidationCoordinator;  // 실제 청산 재평가를 요청하는 Coordinator

    // 단일 스레드 스케쥴러 (트리거만 담당, 실제 처리는 Coordinator 스레드풀)
    private final ScheduledExecutorService schedulerExecutor = Executors.newSingleThreadScheduledExecutor( new LiquidationReplayThreadFactory());
    private ScheduledFuture<?> replayTask;  // 현재 실행 중인 스케줄 태스크 참조 (중복 실행 방지 및 취소용)

    // 감시할 심볼이 생겼을 때 스케줄러를 시작하는 메서드
    // synchronized: 여러 스레드가 동시에 호출해도 한 번에 하나만 실행
    public synchronized void refreshSchedule() {
        // 감시할 심볼이 없으면 스케줄러 중지 후 return
        if(liquidationRegistry.getWatchedSymbols().isEmpty()) {
            stopReplayTask();
            return;
        }

        // 작업이 존재하고, 아직 완료되지 않았고, 취소되지도 않았다면 -> 현재 돌고 있는 작업이 있다
        if(replayTask != null && !replayTask.isDone() && !replayTask.isCancelled()) {
            return;
        }

        // 1초마다 replayWatchedSymbols()를 반복 실행하는 태스크 등록
        // scheduleWithFixedDelay: 이전 실행이 끝난 후 1초 뒤에 다음 실행 시작
        replayTask = schedulerExecutor.scheduleWithFixedDelay(
                this::replayWatchedSymbols, // 실행할 메서드
                REPLAY_INTERVAL_MILLIS,  // 최초 실행까지 대기 시간 (1초
                REPLAY_INTERVAL_MILLIS, // 반복 실행 간격 (1초)
                TimeUnit.MILLISECONDS  // 시간 단위
        );
        log.info("[강제청산 스케줄러] 시작 watchedSymbols={}", liquidationRegistry.getWatchedSymbols());
    }

    // 감시할 심볼이 없을 때 스케줄러를 중지하는 메서드
    public synchronized void stopIfIdle() {
        if (!liquidationRegistry.getWatchedSymbols().isEmpty()) {
            return;
        }
        stopReplayTask();
    }

    // 1초마다 실행 — 감시 중인 심볼을 순회하며 Coordinator에 재평가 요청
    private void replayWatchedSymbols() {
        // 현재 감시 중인 심볼 목록 조회
        List<String> watchedSymbols = liquidationRegistry.getWatchedSymbols();

        // 심볼이 없으면 스케줄러 중지 후 return
        if (watchedSymbols.isEmpty()) {
            stopIfIdle();
            return;
        }

        // 각 심볼에 대해 Coordinator에 재평가 요청
        // 틱이 정상이면 Coordinator 내부 markProcessing 게이트에서 즉시 return됨
        for (String symbol : watchedSymbols) {
            liquidationCoordinator.requestReplay(symbol);
        }

        // 처리 후 감시할 심볼이 없으면 스케줄러 중지
        stopIfIdle();
    }

    // 실행 중인 스케줄 태스크를 취소하고 null로 초기화
    private synchronized void stopReplayTask() {
        // 이미 중지된 상태면 return
        if (replayTask == null) {
            return;
        }
        // false: 실행 중인 작업을 강제 중단하지 않고 다음 스케줄만 취소
        replayTask.cancel(false);
        replayTask = null;
        log.info("[강제청산 스케줄러] 중지");
    }

    // 서버 종료 시 자동 호출 — 스케줄러 스레드를 정리해서 graceful shutdown 보장
    @PreDestroy
    public synchronized void shutdown() {
        stopReplayTask();
        schedulerExecutor.shutdown();
    }

    // 스케줄러 스레드 이름을 "liquidation-replay"로 지정
    // 로그나 스레드 덤프에서 어떤 스레드인지 쉽게 식별 가능
    private static final class LiquidationReplayThreadFactory implements ThreadFactory {
        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable, "liquidation-replay");
            thread.setDaemon(true); // 데몬 스레드: 메인 스레드 종료 시 같이 종료됨
            return thread;
        }
    }
}
