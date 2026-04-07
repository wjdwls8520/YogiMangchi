package com.yogimangchi.domain.contest.season.dto.query;

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
        boolean isPublic,
        boolean isCancel
) { }
