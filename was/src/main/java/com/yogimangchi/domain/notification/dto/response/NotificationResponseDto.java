package com.yogimangchi.domain.notification.dto.response;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.notification.entity.Notification;
import com.yogimangchi.domain.notification.enums.NotificationType;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "알림 응답")
public record NotificationResponseDto(
        @Schema(description = "알림 ID", example = "1")
        Long notificationId,

        @Schema(description = "알림 발생 주체 회원 ID, 시스템 알림인 경우 null", example = "12")
        Long actorMemberId,

        @Schema(description = "알림 타입")
        NotificationType type,

        @Schema(description = "화면에 표시할 알림 문구", example = "비트코인 지정가 매수 주문이 체결되었습니다.")
        String message,

        @Schema(description = "알림 클릭 시 이동할 경로", example = "/trade/orders/14")
        String link,

        @Schema(description = "읽음 여부", example = "false")
        boolean isRead,

        @Schema(description = "알림 생성 시각")
        LocalDateTime createdAt,

        @Schema(description = "도메인별 추가 데이터를 담는 payload 객체")
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
                    notification.getType(),
                    notification.getMessage(),
                    notification.getLink(),
                    notification.isRead(),
                    notification.getCreatedAt(),
                    payload
            );
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("알림 payload 파싱에 실패했습니다.", exception);
        }
    }
}
