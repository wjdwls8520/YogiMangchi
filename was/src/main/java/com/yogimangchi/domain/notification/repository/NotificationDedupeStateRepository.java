package com.yogimangchi.domain.notification.repository;

import com.yogimangchi.domain.notification.entity.NotificationDedupeState;
import com.yogimangchi.domain.notification.enums.NotificationTargetType;
import com.yogimangchi.domain.notification.enums.NotificationType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationDedupeStateRepository extends JpaRepository<NotificationDedupeState, Long> {

    // 같은 actor가 같은 receiver의 같은 target에 대해 이미 알림을 발생시켰는지 확인한다.
    boolean existsByNotificationTypeAndActorIdAndReceiverIdAndTargetTypeAndTargetId(
            NotificationType notificationType,
            Long actorId,
            Long receiverId,
            NotificationTargetType targetType,
            Long targetId
    );

    // 팔로우 쿨타임처럼 마지막 알림 시각을 확인해야 하는 경우 상태 row를 조회한다.
    Optional<NotificationDedupeState> findByNotificationTypeAndActorIdAndReceiverIdAndTargetTypeAndTargetId(
            NotificationType notificationType,
            Long actorId,
            Long receiverId,
            NotificationTargetType targetType,
            Long targetId
    );
}
