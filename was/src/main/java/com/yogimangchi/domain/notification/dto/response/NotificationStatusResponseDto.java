package com.yogimangchi.domain.notification.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "알림 상태 응답")
public record NotificationStatusResponseDto(

        @Schema(description = "마지막 확인 이후 새 알림 개수", example = "3")
        long newCount,

        @Schema(description = "마지막 확인 이후 새 알림 존재 여부", example = "true")
        boolean hasNew,

        @Schema(description = "읽지 않은 알림 개수", example = "7")
        long unreadCount,

        @Schema(description = "읽지 않은 알림 존재 여부", example = "true")
        boolean hasUnread
) {
    // count 기반으로 boolean 상태를 함께 내려주는 공통 팩토리 메서드
    public static NotificationStatusResponseDto of(long newCount, long unreadCount) {
        return new NotificationStatusResponseDto(
                newCount,
                newCount > 0,
                unreadCount,
                unreadCount > 0
        );
    }
}
