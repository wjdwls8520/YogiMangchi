package com.yogimangchi.domain.notification.repository;

import com.yogimangchi.domain.notification.entity.NotificationGroupState;
import com.yogimangchi.domain.notification.enums.NotificationTargetType;
import com.yogimangchi.domain.notification.enums.NotificationType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationGroupStateRepository extends JpaRepository<NotificationGroupState, Long> {

    // 현재 receiver/type/target 조합이 어떤 notification row를 대표로 보고 있는지 조회한다.
    @EntityGraph(attributePaths = {"notification", "notification.actor"})
    Optional<NotificationGroupState> findByReceiverIdAndNotificationTypeAndTargetTypeAndTargetId(
            Long receiverId,
            NotificationType notificationType,
            NotificationTargetType targetType,
            Long targetId
    );

    // 같은 receiver/type/target 조합의 묶음 알림 처리를 직렬화해 동시 생성 경쟁을 줄인다.
    @Query(value = """
        select pg_advisory_xact_lock(
            hashtext(concat(:receiverId, ':', :notificationType, ':', :targetType, ':', :targetId))
        )
        """, nativeQuery = true)
    void lockGroupKey(
            @Param("receiverId") Long receiverId,
            @Param("notificationType") String notificationType,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId
    );

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        delete from NotificationGroupState ngs
        where ngs.notification.id = :notificationId
          and ngs.receiver.id = :receiverId
    """)
    int deleteByNotificationIdAndReceiverId(@Param("notificationId") Long notificationId,
                                            @Param("receiverId") Long receiverId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        delete from NotificationGroupState ngs
        where ngs.notification.id in :notificationIds
          and ngs.receiver.id = :receiverId
    """)
    int deleteAllByNotificationIdsAndReceiverId(@Param("notificationIds") List<Long> notificationIds,
                                                @Param("receiverId") Long receiverId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        delete from NotificationGroupState ngs
        where ngs.receiver.id = :receiverId
          and ngs.notification.isRead = true
          and ngs.notification.id <= :lastCheckedNotificationId
    """)
    int deleteAllReadCheckedGroupsByReceiverId(@Param("receiverId") Long receiverId,
                                               @Param("lastCheckedNotificationId") Long lastCheckedNotificationId);
}
