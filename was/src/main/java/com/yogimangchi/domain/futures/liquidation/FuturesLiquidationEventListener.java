package com.yogimangchi.domain.futures.liquidation;

import com.yogimangchi.domain.futures.event.PositionClosedEvent;
import com.yogimangchi.domain.futures.event.PositionOpenedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.event.TransactionPhase;

@Slf4j
@Component
@RequiredArgsConstructor
public class FuturesLiquidationEventListener {

    private final FuturesLiquidationRegistry liquidationRegistry;
    private final FuturesLiquidationScheduler liquidationScheduler;

    // 포지션 오픈 트랜잭션 커밋 완료 후 실행
    // 커밋 전에 Registry 등록 시 롤백되면 인메모리만 등록된 상태가 됨 → AFTER_COMMIT 필수
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPositionOpened(PositionOpenedEvent event) {
        liquidationRegistry.register(event.symbol());
        liquidationScheduler.refreshSchedule();
        log.info("[강제청산 Registry 등록] symbol={}", event.symbol());
    }

    // 포지션 완전 청산 트랜잭션 커밋 완료 후 실행
    // 커밋 전에 deregister 시 롤백되면 Registry에서 제거됐는데 DB엔 포지션이 남는 상황 발생
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPositionClosed(PositionClosedEvent event) {
        liquidationRegistry.deregister(event.symbol());
        liquidationScheduler.stopIfIdle();
        log.info("[강제청산 Registry 해제] symbol={}", event.symbol());
    }
}
