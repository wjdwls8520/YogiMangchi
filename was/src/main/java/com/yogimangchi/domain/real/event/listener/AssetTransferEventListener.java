package com.yogimangchi.domain.real.event.listener;

import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.real.event.AssetTransferCompletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;


// 자산 이체 관련 이벤트 리스너
// 트랜잭션 커밋 완료 후 비동기로 알림 처리를 수행합니다.
@Slf4j
@Component
@RequiredArgsConstructor
public class AssetTransferEventListener {

    private final NotificationService notificationService;

    // 비즈니스 트랜잭션이 성공적으로 커밋된 직후에만 실행됩니다.
    // 비동기(@Async) 처리를 통해 알림 로직의 지연이 메인 로직 응답 속도에 영향을 주지 않도록 합니다.
    @Async("emailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAssetTransferCompleted(AssetTransferCompletedEvent event) {
        log.info("자산 이체 완료 이벤트 수신. memberId={}, transferHistoryId={}", 
                event.memberId(), event.transferHistoryId());
        
        try {
            notificationService.saveAndSendAssetTransferCompleted(event.memberId(), event.transferHistoryId());
        } catch (Exception e) {
            // 알림 발송 실패가 비즈니스 로직에 영향을 주면 안 되므로 예외를 내부에서 소화합니다.
            log.error("자산 이체 알림 발송 중 오류 발생. transferHistoryId={}", event.transferHistoryId(), e);
        }
    }
}
