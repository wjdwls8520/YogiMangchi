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
        boolean isCancel,
        // settledAt — 정산 완료 시각. null 이면 미정산. displayStatus 가 SETTLED 로 분기되는 기준.
        LocalDateTime settledAt
) {
    public ContestParticipationSeasonDto toResponseDto(LocalDateTime now) {
        ContestSeasonDisplayInfo displayInfo = ContestSeasonDisplayInfo.from(
                isPublic,
                isCancel,
                recruitmentStartAt,
                recruitmentEndAt,
                contestStartAt,
                contestEndAt,
                settledAt,
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
