package com.yogimangchi.domain.futures.limitTradeEngine;

import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 서버 재시작 시 인메모리 Registry 복원 서비스
 *
 * 서버가 내려간 사이에도 DB에는 PENDING 지정가 주문이 남아있다.
 * ApplicationReadyEvent 시점에 DB를 조회해 해당 심볼들을 Registry에 다시 등록하고
 * 스케줄러를 가동해 체결 감시를 재개한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FuturesLimitOrderBootstrapService {

    private final FuturesOrderRepository futuresOrderRepository;
    private final FuturesLimitOrderRegistry limitOrderRegistry;
    private final FuturesLimitOrderScheduler limitOrderScheduler;

    // 서버 기동 완료 후 PENDING 지정가 주문 심볼 복원
    @EventListener(ApplicationReadyEvent.class)
    public void restoreOnStartup() {
        List<String> pendingSymbols = futuresOrderRepository.findDistinctPendingLimitOrderSymbols();

        if (pendingSymbols.isEmpty()) {
            log.info("[지정가 Bootstrap] 복원할 PENDING 주문 없음");
            return;
        }

        // 심볼별 PENDING 주문 수 만큼 register — 정확한 카운트 복원은 주문 수 기준으로 재조회
        for (String symbol : pendingSymbols) {
            int count = futuresOrderRepository.findAllPendingLimitOrdersBySymbol(symbol).size();
            for (int i = 0; i < count; i++) {
                limitOrderRegistry.register(symbol);
            }
        }

        limitOrderScheduler.refreshSchedule();
        log.info("[지정가 Bootstrap] 복원 완료 — symbols={}", pendingSymbols);
    }
}
