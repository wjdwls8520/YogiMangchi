package com.yogimangchi.domain.notification.dto.payload;

public record ContestApplicationApprovedNotificationPayload(
        Long seasonId,
        String contestName
) {
}
