package com.yogimangchi.domain.notification.repository;

import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.enums.NotificationCategory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 회원이 받은 가장 최신 알림 ID를 조회하는 쿼리
    @Query("""
        select max(n.id)
        from Notification n
        where n.receiver.id = :receiverId
    """)
    Long findLatestNotificationIdByReceiverId(@Param("receiverId") Long receiverId);

    // 회원이 받은 전체 알림 수를 조회하는 쿼리
    @Query("""
        select count(n)
        from Notification n
        where n.receiver.id = :receiverId
    """)
    long countByReceiverId(@Param("receiverId") Long receiverId);

    // 읽지 않은 알림 수를 조회하는 쿼리
    @Query("""
        select count(n)
        from Notification n
        where n.receiver.id = :receiverId
          and n.isRead = false
    """)
    long countByReceiverIdAndIsReadFalse(@Param("receiverId") Long receiverId);

    // 마지막 확인 시점 이후 새로 들어온 알림 수를 조회하는 쿼리
    @Query("""
        select count(n)
        from Notification n
        where n.receiver.id = :receiverId
          and n.id > :lastCheckedNotificationId
    """)
    long countByReceiverIdAndIdGreaterThan(@Param("receiverId") Long receiverId,
                                           @Param("lastCheckedNotificationId") Long lastCheckedNotificationId);

    // 로그인 회원 기준으로 단건 읽음 처리 대상 알림을 조회하는 쿼리
    @Query("""
        select n
        from Notification n
        where n.id = :notificationId
          and n.receiver.id = :receiverId
    """)
    Optional<Notification> findByIdAndReceiverId(@Param("notificationId") Long notificationId,
                                                 @Param("receiverId") Long receiverId);

    // 최신순 목록 조회에 cursor/read 필터를 함께 적용하는 쿼리
    @EntityGraph(attributePaths = "actor")
    @Query("""
        select n
        from Notification n
        where n.receiver.id = :receiverId
          and (:cursorId is null or n.id < :cursorId)
          and (:category is null or n.category = :category)
          and (:read is null or n.isRead = :read)
        order by n.id desc
    """)
    List<Notification> findAllByReceiverIdWithCursor(@Param("receiverId") Long receiverId,
                                                     @Param("cursorId") Long cursorId,
                                                     @Param("category") NotificationCategory category,
                                                     @Param("read") Boolean read,
                                                     Pageable pageable);

    @EntityGraph(attributePaths = "actor")
    @Query("""
        select n
        from Notification n
        where n.receiver.id = :receiverId
          and n.id > :lastEventId
        order by n.id asc
    """)
    List<Notification> findAllByReceiverIdAndIdGreaterThanOrderByIdAsc(@Param("receiverId") Long receiverId,
                                                                       @Param("lastEventId") Long lastEventId);

    // 로그인 회원의 읽지 않은 전체 알림을 같은 시각으로 읽음 처리하는 벌크 업데이트 쿼리
    // flushAutomatically - 기존 변경사항을 먼저 DB에 반영 clearAutomatically - 이후 오래된 영속성 컨텍스트를 비워서 꼬임 방지
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        update Notification n
        set n.isRead = true,
            n.readAt = :readAt
        where n.receiver.id = :receiverId
          and n.isRead = false
    """)
    int markAllAsReadByReceiverId(@Param("receiverId") Long receiverId,
                                  @Param("readAt") LocalDateTime readAt);

    // 로그인 회원이 선택한 읽지 않은 알림만 읽음 처리하는 벌크 업데이트 쿼리
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        update Notification n
        set n.isRead = true,
            n.readAt = :readAt
        where n.receiver.id = :receiverId
          and n.id in :notificationIds
          and n.isRead = false
    """)
    int markAllAsReadByIdsAndReceiverId(@Param("notificationIds") List<Long> notificationIds,
                                        @Param("receiverId") Long receiverId,
                                        @Param("readAt") LocalDateTime readAt);

    // 로그인 회원의 읽은 알림만 하드 딜리트하는 벌크 삭제 쿼리
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        delete from Notification n
        where n.receiver.id = :receiverId
          and n.isRead = true
          and n.id <= :lastCheckedNotificationId
    """)
    int deleteAllReadCheckedByReceiverId(@Param("receiverId") Long receiverId,
                                         @Param("lastCheckedNotificationId") Long lastCheckedNotificationId);

    // 로그인 회원의 단건 알림만 삭제하도록 receiver 조건을 함께 건 벌크 삭제 쿼리
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        delete from Notification n
        where n.id = :notificationId
          and n.receiver.id = :receiverId
    """)
    int deleteByIdAndReceiverId(@Param("notificationId") Long notificationId,
                                @Param("receiverId") Long receiverId);

    // 로그인 회원이 선택한 여러 알림만 삭제하는 벌크 삭제 쿼리
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        delete from Notification n
        where n.id in :notificationIds
          and n.receiver.id = :receiverId
    """)
    int deleteAllByIdsAndReceiverId(@Param("notificationIds") List<Long> notificationIds,
                                    @Param("receiverId") Long receiverId);
}
