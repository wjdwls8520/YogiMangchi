package com.yogimangchi.domain.auth.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.time.LocalDateTime;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SignupInfoResponse(
        String provider,
        String email,
        String nickname,
        String profileImageUrl,
        String role,
        LocalDateTime createdAt
) {
}
