package com.yogimangchi.domain.contest.application.dto.query;

import java.time.LocalDateTime;

public record ContestRejectedApplicantQueryDto(
        Long rejectedApplicantId,
        Long memberId,
        String nickname,
        String profileImgUrl,
        LocalDateTime appliedAt,
        LocalDateTime rejectedAt,
        String rejectReason,
        Long rejectedByAdminId,
        String rejectedByAdminNickname,
        String rejectedByAdminProfileImgUrl
) {
}
