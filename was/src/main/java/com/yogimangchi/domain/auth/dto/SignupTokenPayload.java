package com.yogimangchi.domain.auth.dto;

import java.time.LocalDateTime;

public record SignupTokenPayload(
        String email,
        String role,
        String provider,
        String providerUserId,
        String nickname,
        String profileImgUrl,
        LocalDateTime createdAt
) {
}
