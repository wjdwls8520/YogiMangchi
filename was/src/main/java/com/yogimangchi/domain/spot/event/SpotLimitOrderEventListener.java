package com.yogimangchi.domain.spot.event;

import com.yogimangchi.domain.spot.matching.LimitOrderSignalRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class SpotLimitOrderEventListener {

    private final LimitOrderSignalRegistry limitOrderSignalRegistry;

    // 트랜잭션이 커밋된 직후에만 메모리 카운트를 갱신하여 DB와의 정합성을 보장한다.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleLimitOrderCountEvent(SpotLimitOrderCountEvent event) {
        if (event.isIncrement()) {
            limitOrderSignalRegistry.incrementOpenOrder(event.symbol());
        } else {
            limitOrderSignalRegistry.decrementOpenOrder(event.symbol());
        }
    }
}
