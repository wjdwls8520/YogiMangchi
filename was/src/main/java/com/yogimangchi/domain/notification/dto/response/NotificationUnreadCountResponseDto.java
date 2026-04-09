package com.yogimangchi.domain.notification.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "읽지 않은 알림 개수 응답")
public record NotificationUnreadCountResponseDto(
        @Schema(description = "읽지 않은 알림 개수", example = "3")
        long unreadCount,

        @Schema(description = "읽지 않은 알림 존재 여부", example = "true")
        boolean hasUnread
) {
    public static NotificationUnreadCountResponseDto from(long unreadCount) {
        return new NotificationUnreadCountResponseDto(unreadCount, unreadCount > 0);
    }
}
