package com.yogimangchi.domain.notification.entity;

import com.yogimangchi.domain.member.entity.Member;
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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

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
    @Schema(description = "알림 타입")
    private NotificationType type;

    @Column(nullable = false, length = 500)
    @Schema(description = "화면에 바로 표시할 알림 문구", example = "(모의투자) 비트코인 시장가 매수 주문이 체결되었습니다.")
    private String message;

    @Column(length = 1000)
    @Schema(description = "알림 클릭 시 이동 경로", example = "/trade/orders/14")
    private String link;

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

    // 알림 종류별 추가 데이터 저장 필드
    @Column(name = "payload_json", columnDefinition = "text")
    @Schema(description = "도메인별 추가 데이터를 담는 JSON 문자열")
    private String payloadJson;

    public static Notification create(Member receiver, Member actor, NotificationType type,
                                      String message, String link, String payloadJson) {
        // 공통 알림 엔티티 생성 로직
        Notification notification = new Notification();
        notification.receiver = receiver;
        notification.actor = actor;
        notification.type = type;
        notification.message = message;
        notification.link = link;
        notification.payloadJson = payloadJson;
        notification.isRead = false;
        notification.readAt = null;
        return notification;
    }

    public void markAsRead(LocalDateTime readAt) {
        // 중복 읽음 처리 방어 로직
        if (this.isRead) {
            return;
        }

        // 읽음 상태 반영 로직
        this.isRead = true;
        this.readAt = readAt;
    }
}
