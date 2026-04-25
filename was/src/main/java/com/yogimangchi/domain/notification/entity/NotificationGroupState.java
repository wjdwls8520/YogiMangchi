package com.yogimangchi.domain.notification.entity;

import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.notification.enums.NotificationTargetType;
import com.yogimangchi.domain.notification.enums.NotificationType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "notification_group_state",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_notification_group_state",
                        columnNames = {
                                "receiver_member_id",
                                "notification_type",
                                "target_type",
                                "target_id"
                        }
                )
        }
)
public class NotificationGroupState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_member_id", nullable = false)
    private Member receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    private NotificationTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "notification_id", nullable = false)
    private Notification notification;

    @Column(name = "group_count", nullable = false)
    private Long groupCount;

    @Column(name = "last_event_at", nullable = false)
    private LocalDateTime lastEventAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static NotificationGroupState create(
            Member receiver,
            NotificationType notificationType,
            NotificationTargetType targetType,
            Long targetId,
            Notification notification,
            LocalDateTime eventAt
    ) {
        NotificationGroupState state = new NotificationGroupState();
        state.receiver = receiver;
        state.notificationType = notificationType;
        state.targetType = targetType;
        state.targetId = targetId;
        state.notification = notification;
        state.groupCount = 1L;
        state.lastEventAt = eventAt;
        return state;
    }

    public void incrementGroup(LocalDateTime eventAt) {
        // check 전까지는 같은 notification row에 좋아요 수만 누적한다.
        this.groupCount = this.groupCount + 1L;
        this.lastEventAt = eventAt;
    }

    public void restartGroup(Notification notification, LocalDateTime eventAt) {
        // check 이후에는 같은 그룹 키라도 새 notification row부터 다시 묶음을 시작한다.
        this.notification = notification;
        this.groupCount = 1L;
        this.lastEventAt = eventAt;
    }
}
