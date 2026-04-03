package com.yogimangchi.domain.contest.dto.query;

import com.yogimangchi.domain.contest.dto.response.ContestParticipationSeasonDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonStatusResponseDto;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;

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
        ContestSeasonStatus seasonStatus
) {
    public ContestParticipationSeasonDto toResponseDto() {
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
                ContestSeasonStatusResponseDto.from(seasonStatus)
        );
    }
}
