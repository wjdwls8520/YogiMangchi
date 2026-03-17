package com.yogimangchi.global.auth.jwt.dto;

public record AuthTokens(
        String accessToken,
        String refreshToken
) {
}
