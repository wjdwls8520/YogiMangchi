package com.yogimangchi.domain.trade.matching;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LimitOrderScheduler {

    private final LimitOrderSignalRegistry signalRegistry;
    private final LimitOrderMatchCoordinator limitOrderMatchCoordinator;

    // 가격 틱 누락 대비 1초 보조 재시도 스케줄러
    @Scheduled(fixedDelay = 1000L)
    public void replayOpenSymbols() {
        for (String symbol : signalRegistry.getOpenSymbols()) {
            limitOrderMatchCoordinator.requestReplay(symbol);
        }
    }
}
