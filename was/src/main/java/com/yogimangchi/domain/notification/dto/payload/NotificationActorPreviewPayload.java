package com.yogimangchi.domain.notification.dto.payload;

public record NotificationActorPreviewPayload(
        Long memberId,
        String nickname,
        String profileImageUrl
) {
}
