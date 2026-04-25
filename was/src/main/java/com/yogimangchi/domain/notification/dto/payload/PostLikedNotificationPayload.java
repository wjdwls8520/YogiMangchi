package com.yogimangchi.domain.notification.dto.payload;

public record PostLikedNotificationPayload(
        Long postId,
        Long actorMemberId,
        String actorNickname,
        String actorProfileImageUrl
) {
}
