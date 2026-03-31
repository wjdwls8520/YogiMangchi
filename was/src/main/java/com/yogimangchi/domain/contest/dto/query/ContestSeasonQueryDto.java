package com.yogimangchi.domain.contest.dto.query;

import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;

import java.time.LocalDateTime;

public record ContestSeasonQueryDto(
        Long id,
        String title,
        String description,
        LocalDateTime recruitmentStartAt,
        LocalDateTime recruitmentEndAt,
        LocalDateTime contestStartAt,
        LocalDateTime contestEndAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        ContestSeasonStatus status
) { }
