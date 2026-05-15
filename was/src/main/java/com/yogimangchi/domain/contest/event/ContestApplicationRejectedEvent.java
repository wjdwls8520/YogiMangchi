package com.yogimangchi.domain.contest.event;

public record ContestApplicationRejectedEvent(
        Long memberId,
        Long seasonId,
        String contestName,
        String rejectReason
) {
}
