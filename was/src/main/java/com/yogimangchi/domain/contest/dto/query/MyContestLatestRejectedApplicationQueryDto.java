package com.yogimangchi.domain.contest.dto.query;

import com.yogimangchi.domain.contest.dto.response.ContestSeasonStatusResponseDto;
import com.yogimangchi.domain.contest.dto.response.MyContestLatestRejectedApplicationDto;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;

import java.time.LocalDateTime;

public record MyContestLatestRejectedApplicationQueryDto(
        Long rejectedApplicantId,
        Long seasonId,
        String seasonTitle,
        String seasonDescription,
        ContestSeasonStatus seasonStatus,
        LocalDateTime appliedAt,
        LocalDateTime rejectedAt,
        String rejectReason,
        Long rejectedByAdminId,
        String rejectedByAdminNickname,
        String rejectedByAdminProfileImgUrl
) {
    public MyContestLatestRejectedApplicationDto toResponseDto() {
        return new MyContestLatestRejectedApplicationDto(
                rejectedApplicantId,
                seasonId,
                seasonTitle,
                seasonDescription,
                ContestSeasonStatusResponseDto.from(seasonStatus),
                appliedAt,
                rejectedAt,
                rejectReason,
                rejectedByAdminId,
                rejectedByAdminNickname,
                rejectedByAdminProfileImgUrl
        );
    }
}
