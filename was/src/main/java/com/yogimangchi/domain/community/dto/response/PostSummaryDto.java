package com.yogimangchi.domain.community.dto.response;

public record PostSummaryDto(
        Long id,
        String title,
        String content,
        String nickname,
        String createdAt
) {}
