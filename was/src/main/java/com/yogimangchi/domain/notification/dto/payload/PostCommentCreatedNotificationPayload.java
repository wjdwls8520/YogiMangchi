package com.yogimangchi.domain.notification.dto.payload;

public record PostCommentCreatedNotificationPayload(
        Long postId,
        Long replyId,
        String postTitle,
        Long actorMemberId,
        String actorNickname,
        String actorProfileImageUrl,
        String replyContentPreview
) {
}
