package com.yogimangchi.domain.notification.dto.payload;

public record ReplyLikedNotificationPayload(
        Long postId,
        Long replyId,
        Long actorMemberId,
        String actorNickname,
        String actorProfileImageUrl
) {
}
