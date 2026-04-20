package com.yogimangchi.domain.notification.dto.response;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.enums.NotificationCategory;
import com.yogimangchi.domain.notification.enums.NotificationType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "알림 응답")
public record NotificationResponseDto(
        @Schema(description = "알림 ID", example = "1")
        Long notificationId,

        @Schema(description = "알림 발생 주체 회원 ID, 시스템 알림인 경우 null", example = "12")
        Long actorMemberId,

        @Schema(description = "알림 카테고리", example = "MOCK")
        NotificationCategory category,

        @Schema(description = "알림 타입")
        NotificationType type,

        @Schema(description = "읽음 여부", example = "false")
        boolean isRead,

        @Schema(description = "알림 생성 시각")
        LocalDateTime createdAt,

        @Schema(description = "알림에 마지막 실제 이벤트가 반영된 시각")
        LocalDateTime lastEventAt,

        @Schema(description = "화면 렌더링에 필요한 payload 객체")
        JsonNode payload
) {
    public static NotificationResponseDto from(Notification notification, ObjectMapper objectMapper) {
        try {
            JsonNode payload = notification.getPayloadJson() == null
                    ? objectMapper.nullNode()
                    : objectMapper.readTree(notification.getPayloadJson());

            return new NotificationResponseDto(
                    notification.getId(),
                    notification.getActor() == null ? null : notification.getActor().getId(),
                    notification.getCategory(),
                    notification.getType(),
                    notification.isRead(),
                    notification.getCreatedAt(),
                    notification.getLastEventAt(),
                    payload
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("알림 payload 파싱에 실패했습니다.", exception);
        }
    }
}
