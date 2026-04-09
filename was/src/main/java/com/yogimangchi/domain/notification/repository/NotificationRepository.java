package com.yogimangchi.domain.notification.repository;

import com.yogimangchi.domain.notification.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    long countByReceiverIdAndIsReadFalse(Long receiverId);

    Optional<Notification> findByIdAndReceiverId(Long notificationId, Long receiverId);

    List<Notification> findAllByIdInAndReceiverId(List<Long> notificationIds, Long receiverId);

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

    @EntityGraph(attributePaths = "actor")
    @Query("""
        select n
        from Notification n
        where n.receiver.id = :receiverId
          and (:cursorId is null or n.id < :cursorId)
          and (:read is null or n.isRead = :read)
          and n.createdAt >= :startDateTime
          and n.createdAt < :endDateTime
        order by n.id desc
    """)
    List<Notification> findAllTodayByReceiverIdWithCursor(@Param("receiverId") Long receiverId,
                                                          @Param("cursorId") Long cursorId,
                                                          @Param("read") Boolean read,
                                                          @Param("startDateTime") LocalDateTime startDateTime,
                                                          @Param("endDateTime") LocalDateTime endDateTime,
                                                          Pageable pageable);
}
