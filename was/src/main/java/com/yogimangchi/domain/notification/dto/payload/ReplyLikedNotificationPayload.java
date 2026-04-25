package com.yogimangchi.domain.notification.dto.payload;

import java.util.List;

public record ReplyLikedNotificationPayload(
        Long postId,
        Long replyId,
        Long groupCount,
        List<NotificationActorPreviewPayload> actorsPreview
) {
}
