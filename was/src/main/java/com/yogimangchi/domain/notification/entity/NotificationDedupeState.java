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
@Table(
        name = "notification_dedupe_state",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_notification_dedupe_state",
                        columnNames = {
                                "notification_type",
                                "actor_member_id",
                                "receiver_member_id",
                                "target_type",
                                "target_id"
                        }
                )
        }
)
@Schema(description = "[좋아요, 팔로우] 알림 중복 방지 상태 엔티티")
public class NotificationDedupeState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "알림 중복 방지 상태 ID", example = "1")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    @Schema(description = "중복 방지를 적용할 알림 타입")
    private NotificationType notificationType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_member_id", nullable = false)
    @Schema(description = "알림 발생 행동을 한 회원")
    private Member actor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receiver_member_id", nullable = false)
    @Schema(description = "알림 수신 회원")
    private Member receiver;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    @Schema(description = "알림 중복 방지 대상 리소스 종류")
    private NotificationTargetType targetType;

    // targetType에 따라 의미가 달라지는 대상 식별자다.
    // POST면 postId, REPLY면 replyId, MEMBER면 팔로우 대상 회원 id를 저장한다.
    @Column(name = "target_id", nullable = false)
    @Schema(description = "알림 중복 방지 대상 리소스 ID. POST면 postId, REPLY면 replyId, MEMBER면 회원 id", example = "1")
    private Long targetId;

    // 이 조합으로 알림을 '처음' 보낸 시각이다.
    // 좋아요처럼 최초 1회만 보내는 정책에서는 firstNotifiedAt과 lastNotifiedAt이 같은 값으로 유지된다.
    @Column(name = "first_notified_at", nullable = false)
    @Schema(description = "최초 알림 발생 시각. 좋아요는 최초 1회 알림 시각, 팔로우는 첫 알림 시각")
    private LocalDateTime firstNotifiedAt;

    // 이 조합으로 알림을 '마지막으로' 보낸 시각이다.
    // 팔로우처럼 쿨타임 이후 재알림을 허용하는 정책에서는 이 값을 갱신해 다음 허용 시점을 계산한다.
    @Column(name = "last_notified_at", nullable = false)
    @Schema(description = "마지막 알림 발생 시각. 좋아요는 최초값과 같고, 팔로우는 재알림 시 갱신된다")
    private LocalDateTime lastNotifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Schema(description = "알림 중복 방지 상태 생성 시각")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Schema(description = "알림 중복 방지 상태 수정 시각. 팔로우 재알림 등 상태 갱신 시 함께 변경된다")
    private LocalDateTime updatedAt;

    public static NotificationDedupeState create(
            NotificationType notificationType,
            Member actor,
            Member receiver,
            NotificationTargetType targetType,
            Long targetId,
            LocalDateTime notifiedAt
    ) {
        // actor가 같은 receiver의 같은 target에 대해 알림을 이미 발생시켰는지 기록한다.
        // 최초 생성 시점에는 처음 알림 시각과 마지막 알림 시각이 동일하다.
        NotificationDedupeState state = new NotificationDedupeState();
        state.notificationType = notificationType;
        state.actor = actor;
        state.receiver = receiver;
        state.targetType = targetType;
        state.targetId = targetId;
        state.firstNotifiedAt = notifiedAt;
        state.lastNotifiedAt = notifiedAt;
        return state;
    }

    public void updateLastNotifiedAt(LocalDateTime notifiedAt) {
        if (notifiedAt == null) {
            return;
        }

        // 팔로우처럼 쿨타임 이후 재알림을 허용하는 타입에서 마지막 알림 시각을 갱신한다.
        // 좋아요는 최초 1회 정책이라 일반적으로 이 메서드를 호출하지 않는다.
        this.lastNotifiedAt = notifiedAt;
    }
}
