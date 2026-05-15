package com.yogimangchi.domain.contest.event;

public record ContestApplicationApprovedEvent(
        Long memberId,
        Long seasonId,
        String contestName
) {
}
