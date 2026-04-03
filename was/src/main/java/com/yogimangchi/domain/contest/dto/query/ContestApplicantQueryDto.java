package com.yogimangchi.domain.contest.dto.query;

import java.time.LocalDateTime;

public record ContestApplicantQueryDto(
        Long applicantId,
        Long memberId,
        String nickname,
        String profileImgUrl,
        LocalDateTime appliedAt
) {
}
