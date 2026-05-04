package com.yogimangchi.domain.futures.limitTradeEngine;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class FuturesLimitOrderScheduler {

    private static final long REPLAY_INTERVAL_MILLIS = 1000L;

    private final FuturesLimitOrderRegistry limitOrderRegistry;
    private final FuturesLimitOrderCoordinator limitOrderCoordinator;

    // 단일 스레드 스케줄러 — 트리거만 담당, 실제 처리는 Coordinator 스레드풀
    // Java 내장 — 직접 스레드풀 제어 ( 스프링내장 어너텐션인  @Scheduled는 서버 켜있는 동안 항상 실행 → 동적 제어 불가 )
    private final ScheduledExecutorService schedulerExecutor =
            Executors.newSingleThreadScheduledExecutor(new LimitOrderReplayThreadFactory());
    private ScheduledFuture<?> replayTask;

    // 감시할 심볼이 생겼을 때 스케줄러 시작 — 이미 실행 중이면 중복 시작 방지
    public synchronized void refreshSchedule() {
        if(limitOrderRegistry.getWatchedSymbols().isEmpty()) {
            stopReplayTask();
            return;
        }
        if(replayTask != null && !replayTask.isDone() && !replayTask.isCancelled()) {
            return;
        }
        replayTask = schedulerExecutor.scheduleWithFixedDelay(
                this::replayWatchedSymbols,
                REPLAY_INTERVAL_MILLIS,
                REPLAY_INTERVAL_MILLIS,
                TimeUnit.MILLISECONDS
        );
        log.info("[지정가 스케줄러] 시작 watchedSymbols={}", limitOrderRegistry.getWatchedSymbols());
    }

    // 모든 주문이 체결/취소되어 감시할 심볼이 없을 때 스케쥴러 중지
    public synchronized void stopIfIdle() {
        if(!limitOrderRegistry.getWatchedSymbols().isEmpty()) {
            return;
        }
        stopReplayTask();
    }

    // 1초마다 실행 - 감시중인 심볼을 순회하며 Cordinator에 재평가 요청
    // 틱이 정상이면 Coordinator 내부 markProcessing 게이트에서 즉시 return (부담 없음)
    private void replayWatchedSymbols() {
        List<String> watchedSymbols = limitOrderRegistry.getWatchedSymbols();
        if(watchedSymbols.isEmpty()) {
            stopReplayTask();
            return;
        }
        for(String symbol : watchedSymbols) {
            limitOrderCoordinator.requestReplay(symbol);
        }
    }

    // 실행 중인 스케줄 태스크 취소 후 null 초기화
    private synchronized void stopReplayTask() {
        if(replayTask == null) {
            return;
        }
        replayTask.cancel(false); // 실행 중인 작업은 완료 대기, 다음 스케줄만 취소
        replayTask = null;
        log.info("[지정가 스케줄러] 중지");
    }

    // 서버 종료 시 스레드 정리 - graceful shutdown 보장 (처리 중이던 요청은 끝까지 마무리)
    @PreDestroy
    public synchronized void shutdown() {
        stopReplayTask();
        schedulerExecutor.shutdown();
    }

    // 스케줄러 스레드 이름 지정 - 로그/스레드 덤프에서 식별 용어
    private static final class LimitOrderReplayThreadFactory implements ThreadFactory {
        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable, "limit-order-replay");
            thread.setDaemon(true);
            return thread;
        }
    }

}
