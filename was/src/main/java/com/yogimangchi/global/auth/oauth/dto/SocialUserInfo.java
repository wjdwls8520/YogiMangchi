package com.yogimangchi.global.auth.oauth.dto;

public record SocialUserInfo(
        // [ct] dto
        String provider,
        String providerUserId,
        String email,
        String nickname,
        String profileImageUrl
) {
}
