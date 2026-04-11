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

    // 이미 상태 row가 있을 때 더 큰 최신 알림 ID만 반영하는 원자적 갱신 쿼리
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
        update notification_state
        set last_checked_notification_id = greatest(coalesce(last_checked_notification_id, 0), :latestNotificationId),
            updated_at = current_timestamp
        where member_id = :memberId
    """, nativeQuery = true)
    int updateLastCheckedNotificationIdIfGreater(@Param("memberId") Long memberId,
                                                 @Param("latestNotificationId") Long latestNotificationId);
}
