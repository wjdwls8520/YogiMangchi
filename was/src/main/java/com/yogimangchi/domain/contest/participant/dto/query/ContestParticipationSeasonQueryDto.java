package com.yogimangchi.domain.contest.participant.dto.query;

import com.yogimangchi.domain.contest.participant.dto.response.ContestParticipationSeasonDto;
import com.yogimangchi.domain.contest.season.support.ContestSeasonDisplayInfo;

import java.time.LocalDateTime;

public record ContestParticipationSeasonQueryDto(
        Long participantId,
        LocalDateTime appliedAt,
        LocalDateTime approvedAt,
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
    public ContestParticipationSeasonDto toResponseDto(LocalDateTime now) {
        ContestSeasonDisplayInfo displayInfo = ContestSeasonDisplayInfo.from(
                isPublic,
                isCancel,
                recruitmentStartAt,
                recruitmentEndAt,
                contestStartAt,
                contestEndAt,
                now
        );

        return new ContestParticipationSeasonDto(
                participantId,
                appliedAt,
                approvedAt,
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
