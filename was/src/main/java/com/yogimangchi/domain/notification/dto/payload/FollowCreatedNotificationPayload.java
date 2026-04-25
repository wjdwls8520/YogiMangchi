package com.yogimangchi.domain.notification.dto.payload;

public record FollowCreatedNotificationPayload(
        Long actorMemberId,
        String actorNickname,
        String actorProfileImageUrl
) {
}
