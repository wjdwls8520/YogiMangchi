package com.yogimangchi.domain.trade.matching;

import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
// 筌왖?類? 雅뚯눖揆 癰귣똻??????????餓κ쑬彛??뚮똾猷??곕뱜(??彛?
public class LimitOrderScheduler {

    private static final long REPLAY_INTERVAL_MILLIS = 1000L;

    private final LimitOrderSignalRegistry signalRegistry;
    private final LimitOrderMatchCoordinator limitOrderMatchCoordinator;
    private final ScheduledExecutorService schedulerExecutor =
            Executors.newSingleThreadScheduledExecutor(new ReplayThreadFactory());

    private ScheduledFuture<?> replayTask;

    public synchronized void refreshSchedule() {
        if (signalRegistry.getOpenSymbols().isEmpty()) {
            stopReplayTask();
            return;
        }

        if (replayTask != null && !replayTask.isDone() && !replayTask.isCancelled()) {
            return;
        }

        replayTask = schedulerExecutor.scheduleWithFixedDelay(
                this::replayOpenSymbols,
                REPLAY_INTERVAL_MILLIS,
                REPLAY_INTERVAL_MILLIS,
                TimeUnit.MILLISECONDS
        );
        log.info("[scheduler] started replay task openSymbols={}", signalRegistry.getOpenSymbols());
    }

    public synchronized void stopIfIdle() {
        if (!signalRegistry.getOpenSymbols().isEmpty()) {
            return;
        }

        stopReplayTask();
    }

    // 揶쎛野????袁⑥뵭 ????1??癰귣똻??????????餓κ쑬??
    private void replayOpenSymbols() {
        List<String> openSymbols = signalRegistry.getOpenSymbols();
        if (openSymbols.isEmpty()) {
            stopIfIdle();
            return;
        }

        for (String symbol : openSymbols) {
            limitOrderMatchCoordinator.requestReplay(symbol);
        }

        stopIfIdle();
    }

    private synchronized void stopReplayTask() {
        if (replayTask == null) {
            return;
        }

        replayTask.cancel(false);
        replayTask = null;
        log.info("[scheduler] stopped replay task");
    }

    @PreDestroy
    public synchronized void shutdown() {
        stopReplayTask();
        schedulerExecutor.shutdown();
    }

    private static final class ReplayThreadFactory implements ThreadFactory {

        @Override
        public Thread newThread(Runnable runnable) {
            Thread thread = new Thread(runnable, "limit-order-replay");
            thread.setDaemon(true);
            return thread;
        }
    }
}
