package com.yogimangchi.domain.notification.repository;

import com.yogimangchi.domain.notification.entity.NotificationState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationStateRepository extends JpaRepository<NotificationState, Long> {

    // 회원별 마지막 알림 확인 기준점 조회 메서드
    Optional<NotificationState> findByMemberId(Long memberId);

    // 회원별 알림 확인 상태가 없으면 생성하고, 있으면 더 큰 최신 알림 ID만 반영한다.
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
        insert into notification_state (member_id, last_checked_notification_id, updated_at)
        values (:memberId, :latestNotificationId, current_timestamp)
        on conflict (member_id) do update
        set last_checked_notification_id = greatest(
                coalesce(notification_state.last_checked_notification_id, 0),
                excluded.last_checked_notification_id
            ),
            updated_at = current_timestamp
    """, nativeQuery = true)
    int upsertLastCheckedNotificationId(@Param("memberId") Long memberId,
                                        @Param("latestNotificationId") Long latestNotificationId);
}
