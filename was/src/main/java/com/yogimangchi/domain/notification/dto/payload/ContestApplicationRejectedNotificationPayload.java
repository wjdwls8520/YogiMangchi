package com.yogimangchi.domain.notification.dto.payload;

public record ContestApplicationRejectedNotificationPayload(
        Long seasonId,
        String contestName,
        String rejectReason
) {
}
