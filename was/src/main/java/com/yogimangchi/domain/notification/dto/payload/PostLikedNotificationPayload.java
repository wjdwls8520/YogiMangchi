package com.yogimangchi.domain.notification.dto.payload;

import java.util.List;

public record PostLikedNotificationPayload(
        Long postId,
        Long groupCount,
        List<NotificationActorPreviewPayload> actorsPreview
) {
}
