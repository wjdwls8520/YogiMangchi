package com.yogimangchi.domain.contest.application.dto.query;

import com.yogimangchi.domain.contest.application.dto.response.MyContestLatestRejectedApplicationDto;
import com.yogimangchi.domain.contest.season.support.ContestSeasonDisplayInfo;

import java.time.LocalDateTime;

public record MyContestLatestRejectedApplicationQueryDto(
        Long rejectedApplicantId,
        Long seasonId,
        String seasonTitle,
        String seasonDescription,
        LocalDateTime recruitmentStartAt,
        LocalDateTime recruitmentEndAt,
        LocalDateTime contestStartAt,
        LocalDateTime contestEndAt,
        boolean isPublic,
        boolean isCancel,
        LocalDateTime appliedAt,
        LocalDateTime rejectedAt,
        String rejectReason,
        Long rejectedByAdminId,
        String rejectedByAdminNickname,
        String rejectedByAdminProfileImgUrl
) {
    public MyContestLatestRejectedApplicationDto toResponseDto(LocalDateTime now) {
        ContestSeasonDisplayInfo displayInfo = ContestSeasonDisplayInfo.from(
                isPublic,
                isCancel,
                recruitmentStartAt,
                recruitmentEndAt,
                contestStartAt,
                contestEndAt,
                now
        );

        return new MyContestLatestRejectedApplicationDto(
                rejectedApplicantId,
                seasonId,
                seasonTitle,
                seasonDescription,
                displayInfo.isRecruiting(),
                displayInfo.isLive(),
                displayInfo.displayStatus(),
                appliedAt,
                rejectedAt,
                rejectReason,
                rejectedByAdminId,
                rejectedByAdminNickname,
                rejectedByAdminProfileImgUrl
        );
    }
}
