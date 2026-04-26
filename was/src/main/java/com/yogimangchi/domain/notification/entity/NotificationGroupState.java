package com.yogimangchi.domain.notification.entity;

import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.notification.enums.NotificationTargetType;
import com.yogimangchi.domain.notification.enums.NotificationType;
import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "좋아요 묶음 알림 상태 엔티티. 같은 수신자/알림 타입/대상 조합이 현재 어떤 알림 row에 묶여 있는지 추적한다.")
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
    @Schema(description = "묶음 알림 상태 ID", example = "1")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_member_id", nullable = false)
    @Schema(description = "묶음 알림을 받는 회원")
    private Member receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    @Schema(description = "묶음 처리 중인 알림 타입", example = "POST_LIKED")
    private NotificationType notificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    @Schema(description = "묶음 알림 대상 타입", example = "POST")
    private NotificationTargetType targetType;

    @Column(name = "target_id", nullable = false)
    @Schema(description = "묶음 알림 대상 ID. 게시글 좋아요면 postId, 댓글 좋아요면 replyId", example = "123")
    private Long targetId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "notification_id", nullable = false)
    @Schema(description = "현재 이 묶음을 대표하는 실제 알림 row")
    private Notification notification;

    @Column(name = "group_count", nullable = false)
    @Schema(description = "현재 대표 알림 row에 묶여 있는 좋아요 수", example = "3")
    private Long groupCount;

    @Column(name = "last_event_at", nullable = false)
    @Schema(description = "이 묶음에 마지막 좋아요 이벤트가 반영된 시각")
    private LocalDateTime lastEventAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Schema(description = "묶음 상태 생성 시각")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Schema(description = "묶음 상태 수정 시각")
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
