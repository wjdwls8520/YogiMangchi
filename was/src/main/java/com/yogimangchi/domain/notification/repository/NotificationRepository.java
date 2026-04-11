package com.yogimangchi.domain.notification.repository;

import com.yogimangchi.domain.notification.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 회원이 받은 가장 최신 알림 ID 조회 쿼리
    @Query("""
        select max(n.id)
        from Notification n
        where n.receiver.id = :receiverId
    """)
    Long findLatestNotificationIdByReceiverId(@Param("receiverId") Long receiverId);

    // 회원이 받은 전체 알림 수 조회 쿼리
    @Query("""
        select count(n)
        from Notification n
        where n.receiver.id = :receiverId
    """)
    long countByReceiverId(@Param("receiverId") Long receiverId);

    // 읽지 않은 알림 수 조회 쿼리
    @Query("""
        select count(n)
        from Notification n
        where n.receiver.id = :receiverId
          and n.isRead = false
    """)
    long countByReceiverIdAndIsReadFalse(@Param("receiverId") Long receiverId);

    // 마지막 확인 지점 이후 새로 들어온 알림 수 조회 쿼리
    @Query("""
        select count(n)
        from Notification n
        where n.receiver.id = :receiverId
          and n.id > :lastCheckedNotificationId
    """)
    long countByReceiverIdAndIdGreaterThan(@Param("receiverId") Long receiverId,
                                           @Param("lastCheckedNotificationId") Long lastCheckedNotificationId);

    // 로그인 회원 기준 단건 읽음 처리 대상 알림 조회 쿼리
    @Query("""
        select n
        from Notification n
        where n.id = :notificationId
          and n.receiver.id = :receiverId
    """)
    Optional<Notification> findByIdAndReceiverId(@Param("notificationId") Long notificationId,
                                                 @Param("receiverId") Long receiverId);

    // 로그인 회원 기준 다건 읽음 처리 대상 알림 목록 조회 쿼리
    @Query("""
        select n
        from Notification n
        where n.id in :notificationIds
          and n.receiver.id = :receiverId
    """)
    List<Notification> findAllByIdInAndReceiverId(@Param("notificationIds") List<Long> notificationIds,
                                                  @Param("receiverId") Long receiverId);

    // 전체 알림 목록을 최신순으로 조회하고 읽음 여부 필터를 선택 적용하는 쿼리
    @EntityGraph(attributePaths = "actor")
    @Query("""
        select n
        from Notification n
        where n.receiver.id = :receiverId
          and (:cursorId is null or n.id < :cursorId)
          and (:read is null or n.isRead = :read)
        order by n.id desc
    """)
    List<Notification> findAllByReceiverIdWithCursor(@Param("receiverId") Long receiverId,
                                                     @Param("cursorId") Long cursorId,
                                                     @Param("read") Boolean read,
                                                     Pageable pageable);
}
