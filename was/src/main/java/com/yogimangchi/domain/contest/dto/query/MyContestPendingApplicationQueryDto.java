package com.yogimangchi.domain.contest.dto.query;

import com.yogimangchi.domain.contest.dto.response.ContestSeasonStatusResponseDto;
import com.yogimangchi.domain.contest.dto.response.MyContestPendingApplicationDto;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;

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
        ContestSeasonStatus seasonStatus
) {
    public MyContestPendingApplicationDto toResponseDto() {
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
                ContestSeasonStatusResponseDto.from(seasonStatus)
        );
    }
}
