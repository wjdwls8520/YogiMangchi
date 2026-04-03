package com.yogimangchi.domain.trade.matching;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
// 지정가 주문 보조 재시도 스케줄링 컴포넌트(폴링)
public class LimitOrderScheduler {

    private final LimitOrderSignalRegistry signalRegistry;
    private final LimitOrderMatchCoordinator limitOrderMatchCoordinator;

    // 가격 틱 누락 대비 1초 보조 재시도 스케줄러
    @Scheduled(fixedDelay = 1000L)
    public void replayOpenSymbols() {
        log.info("[scheduler] replayOpenSymbols openSymbols={}", signalRegistry.getOpenSymbols());

        for (String symbol : signalRegistry.getOpenSymbols()) {
            limitOrderMatchCoordinator.requestReplay(symbol);
        }
    }
}
