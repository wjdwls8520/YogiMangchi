package com.yogimangchi.domain.notification.dto.result;

import com.yogimangchi.domain.notification.dto.response.NotificationResponseDto;

// 알림 저장 결과와 SSE event name을 함께 반환하는 내부 DTO다.
public record NotificationDispatchResultDto(
        NotificationResponseDto notification,
        String eventName
) {
}
