package com.yogimangchi.domain.contest.dto.query;

import com.yogimangchi.domain.contest.enums.ContestApplicantStatus;

import java.time.LocalDateTime;

public record ContestApplicantQueryDto(
        Long applicantId,
        Long memberId,
        String nickname,
        String profileImgUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        ContestApplicantStatus status
) {
}
