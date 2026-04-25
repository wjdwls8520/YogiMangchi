package com.yogimangchi.domain.notification.repository;

import com.yogimangchi.domain.notification.entity.NotificationDedupeState;
import com.yogimangchi.domain.notification.enums.NotificationTargetType;
import com.yogimangchi.domain.notification.enums.NotificationType;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // 최초 알림 상태 row를 원자적으로 생성하는 네이티브 쿼리
    // 같은 unique key가 이미 있으면 do nothing으로 무시하고 0을 반환
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
        insert into notification_dedupe_state (
            notification_type,
            actor_member_id,
            receiver_member_id,
            target_type,
            target_id,
            first_notified_at,
            last_notified_at,
            created_at,
            updated_at
        )
        values (
            :notificationType,
            :actorId,
            :receiverId,
            :targetType,
            :targetId,
            :notifiedAt,
            :notifiedAt,
            current_timestamp,
            current_timestamp
        )
        on conflict (
            notification_type,
            actor_member_id,
            receiver_member_id,
            target_type,
            target_id
        ) do nothing
        """, nativeQuery = true)
    int insertIgnore(
            @Param("notificationType") String notificationType,
            @Param("actorId") Long actorId,
            @Param("receiverId") Long receiverId,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId,
            @Param("notifiedAt") LocalDateTime notifiedAt
    );
}
