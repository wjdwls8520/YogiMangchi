package com.yogimangchi.domain.contest.event.listener;

import com.yogimangchi.domain.contest.event.ContestApplicationApprovedEvent;
import com.yogimangchi.domain.contest.event.ContestApplicationRejectedEvent;
import com.yogimangchi.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ContestNotificationEventListener {

    private final NotificationService notificationService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleContestApplicationApprovedEvent(ContestApplicationApprovedEvent event) {
        notificationService.notifyContestApplicationApproved(
                event.memberId(),
                event.seasonId(),
                event.contestName()
        );
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleContestApplicationRejectedEvent(ContestApplicationRejectedEvent event) {
        notificationService.notifyContestApplicationRejected(
                event.memberId(),
                event.seasonId(),
                event.contestName(),
                event.rejectReason()
        );
    }
}
