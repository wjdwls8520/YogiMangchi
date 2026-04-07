package com.yogimangchi.domain.contest.participant.dto.query;

import java.time.LocalDateTime;

public record ContestParticipantQueryDto(
        Long participantId,
        Long memberId,
        String nickname,
        String profileImgUrl,
        LocalDateTime appliedAt,
        LocalDateTime approvedAt,
        Long approvedByAdminId,
        String approvedByAdminNickname,
        String approvedByAdminProfileImgUrl
) {
}
