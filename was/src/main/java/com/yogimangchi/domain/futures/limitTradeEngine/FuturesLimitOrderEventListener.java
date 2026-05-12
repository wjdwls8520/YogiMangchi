package com.yogimangchi.domain.futures.limitTradeEngine;

import com.yogimangchi.domain.futures.event.LimitOrderPlacedEvent;
import com.yogimangchi.domain.futures.event.LimitOrderRemovedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class FuturesLimitOrderEventListener {

    private final FuturesLimitOrderRegistry limitOrderRegistry;
    private final FuturesLimitOrderScheduler limitOrderScheduler;

    // 지정가 주문 등록 완료 후 — Registry +1, 스케줄러 활성화
    // AFTER_COMMIT: 트랜잭션 롤백 시 Registry 상태 불일치 방지
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLimitOrderPlaced(LimitOrderPlacedEvent event) {
        limitOrderRegistry.register(event.symbol());
        limitOrderScheduler.refreshSchedule();
        log.debug("[지정가 Registry 등록] symbol={}", event.symbol());
    }

    // 지정가 주문 체결 또는 취소 완료 후 — Registry -count, 감시 심볼 없으면 스케줄러 중지
    // AFTER_COMMIT: 트랜잭션 롤백 시 Registry 상태 불일치 방지
    // 단건 체결/취소는 count=1, 일괄 취소(cleanup)는 영향 행 수만큼 한 번에 차감
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLimitOrderRemoved(LimitOrderRemovedEvent event) {
        limitOrderRegistry.deregister(event.symbol(), event.count());
        limitOrderScheduler.stopIfIdle();
        log.debug("[지정가 Registry 해제] symbol={}, count={}", event.symbol(), event.count());
    }
}
