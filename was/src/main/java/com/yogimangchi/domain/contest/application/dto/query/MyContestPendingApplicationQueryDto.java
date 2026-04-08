package com.yogimangchi.domain.contest.application.dto.query;

import com.yogimangchi.domain.contest.application.dto.response.MyContestPendingApplicationDto;
import com.yogimangchi.domain.contest.season.support.ContestSeasonDisplayInfo;

import java.time.LocalDateTime;

public record MyContestPendingApplicationQueryDto(
        Long applicantId,
        LocalDateTime appliedAt,
        Long seasonId,
        String seasonTitle,
        String seasonDescription,
        LocalDateTime recruitmentStartAt,
        LocalDateTime recruitmentEndAt,
        LocalDateTime contestStartAt,
        LocalDateTime contestEndAt,
        LocalDateTime seasonCreatedAt,
        LocalDateTime seasonUpdatedAt,
        boolean isPublic,
        boolean isCancel
) {
    public MyContestPendingApplicationDto toResponseDto(LocalDateTime now) {
        ContestSeasonDisplayInfo displayInfo = ContestSeasonDisplayInfo.from(
                isPublic,
                isCancel,
                recruitmentStartAt,
                recruitmentEndAt,
                contestStartAt,
                contestEndAt,
                now
        );

        return new MyContestPendingApplicationDto(
                applicantId,
                appliedAt,
                seasonId,
                seasonTitle,
                seasonDescription,
                recruitmentStartAt,
                recruitmentEndAt,
                contestStartAt,
                contestEndAt,
                seasonCreatedAt,
                seasonUpdatedAt,
                displayInfo.isRecruiting(),
                displayInfo.isLive(),
                displayInfo.displayStatus()
        );
    }
}
