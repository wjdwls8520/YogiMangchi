package com.yogimangchi.domain.auth.dto;

public record SocialLoginResult(
        boolean existingMember,
        Long memberId,
        String signupToken
) {
    public static SocialLoginResult existingMember(Long memberId) {
        return new SocialLoginResult(true, memberId, null);
    }

    public static SocialLoginResult newMember(String signupToken) {
        return new SocialLoginResult(false, null, signupToken);
    }
}
