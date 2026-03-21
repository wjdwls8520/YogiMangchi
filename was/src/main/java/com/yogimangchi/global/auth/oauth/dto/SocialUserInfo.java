package com.yogimangchi.global.auth.oauth.dto;

public record SocialUserInfo(
        // [ct] dto 구글이 주는 응답 구조와 카카오가 주는 응답 구조는 서로 달라 공통 형식으로 맞춤.
        String provider,
        String providerUserId,
        String email,
        String nickname,
        String profileImgUrl
) {
}
