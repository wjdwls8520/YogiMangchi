package com.yogimangchi.domain.notification.dto.payload;

public record ReplyCommentCreatedNotificationPayload(
        Long postId,
        Long replyId,
        Long parentReplyId,
        Long targetReplyId,
        Long actorMemberId,
        String actorNickname,
        String actorProfileImageUrl,
        String replyContentPreview
) {
}
