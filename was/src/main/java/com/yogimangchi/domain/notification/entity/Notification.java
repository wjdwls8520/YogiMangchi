package com.yogimangchi.domain.notification.entity;

import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.notification.enums.NotificationCategory;
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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notification")
@Schema(description = "통합 알림 엔티티")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "알림 ID", example = "1")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_member_id", nullable = false)
    @Schema(description = "알림 수신 회원")
    private Member receiver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_member_id")
    @Schema(description = "알림 발생 주체 회원, 시스템 알림이면 null")
    private Member actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Schema(description = "알림 탭 분리를 위한 카테고리", example = "MOCK")
    private NotificationCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Schema(description = "알림 타입")
    private NotificationType type;

    @Column(name = "is_read", nullable = false)
    @Schema(description = "알림 읽음 여부", example = "false")
    private boolean isRead;

    @Column(name = "read_at")
    @Schema(description = "알림 읽음 시각")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Schema(description = "알림 생성 시각")
    private LocalDateTime createdAt;

    @CreationTimestamp
    @Column(name = "last_event_at", nullable = false)
    @Schema(description = "알림에 마지막 실제 이벤트가 반영된 시각")
    private LocalDateTime lastEventAt;

    @Column(name = "payload_json", columnDefinition = "text")
    @Schema(description = "프론트가 메시지와 이동 경로를 조립할 때 사용하는 JSON payload")
    private String payloadJson;

    public static Notification create(Member receiver, Member actor, NotificationCategory category, NotificationType type,
                                      String payloadJson) {
        Notification notification = new Notification();
        notification.receiver = receiver;
        notification.actor = actor;
        notification.category = category;
        notification.type = type;
        notification.payloadJson = payloadJson;
        notification.isRead = false;
        notification.readAt = null;
        return notification;
    }

    public void markAsRead(LocalDateTime readAt) {
        if (this.isRead) {
            return;
        }

        this.isRead = true;
        this.readAt = readAt;
    }

    public void updateLastEventAt(LocalDateTime lastEventAt) {
        if (lastEventAt == null) {
            return;
        }

        this.lastEventAt = lastEventAt;
    }
}
