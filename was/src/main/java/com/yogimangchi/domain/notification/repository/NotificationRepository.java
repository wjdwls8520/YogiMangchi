package com.yogimangchi.domain.notification.repository;

import com.yogimangchi.domain.notification.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = "actor")
    @Query("""
        select n
        from Notification n
        where n.receiver.id = :receiverId
          and (:cursorId is null or n.id < :cursorId)
          and (:read is null or n.isRead = :read)
          and (:startDateTime is null or n.createdAt >= :startDateTime)
          and (:endDateTime is null or n.createdAt < :endDateTime)
        order by n.id desc
    """)
    List<Notification> findAllByReceiverIdWithCursor(@Param("receiverId") Long receiverId,
                                                     @Param("cursorId") Long cursorId,
                                                     @Param("read") Boolean read,
                                                     @Param("startDateTime") java.time.LocalDateTime startDateTime,
                                                     @Param("endDateTime") java.time.LocalDateTime endDateTime,
                                                     Pageable pageable);
}
