package com.yogimangchi.domain.notification.entity;

import com.yogimangchi.domain.member.entity.Member;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notification_state")
@Schema(description = "회원별 알림 확인 상태 엔티티")
public class NotificationState {

    @Id
    @Column(name = "member_id")
    @Schema(description = "알림 상태를 소유한 회원 ID", example = "1")
    private Long memberId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    @Schema(description = "알림 상태를 소유한 회원")
    private Member member;

    // 알림별 확인 여부가 아니라 회원 기준 마지막 확인 지점을 관리하는 필드
    @Column(name = "last_checked_notification_id")
    @Schema(description = "마지막으로 확인한 최신 알림 ID", example = "120")
    private Long lastCheckedNotificationId;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Schema(description = "알림 확인 상태 수정 시각")
    private LocalDateTime updatedAt;

    public static NotificationState create(Member member) {
        // 회원별 알림 상태 생성 로직
        NotificationState notificationState = new NotificationState();
        notificationState.member = member;
        notificationState.memberId = member.getId();
        notificationState.lastCheckedNotificationId = null;
        return notificationState;
    }

    public void checkLatest(Long latestNotificationId) {
        // 확인 기준점 갱신 방어 로직
        if (latestNotificationId == null) {
            return;
        }

        // 더 최신 알림을 확인했을 때만 기준점을 앞으로 이동하는 로직
        if (lastCheckedNotificationId == null || latestNotificationId > lastCheckedNotificationId) {
            this.lastCheckedNotificationId = latestNotificationId;
        }
    }
}
