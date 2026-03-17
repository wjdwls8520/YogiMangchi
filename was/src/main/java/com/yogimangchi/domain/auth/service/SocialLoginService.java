package com.yogimangchi.domain.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.yogimangchi.domain.auth.dto.SocialLoginResult;
import com.yogimangchi.domain.member.entity.OAuthAccount;
import com.yogimangchi.domain.member.repository.OAuthAccountRepository;
import com.yogimangchi.global.auth.oauth.dto.SocialUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SocialLoginService {

    private final OAuthAccountRepository oAuthAccountRepository;
    private final SignupTokenService signupTokenService;

    public SocialLoginResult handleSocialLogin(SocialUserInfo socialUserInfo) {
        String provider = socialUserInfo.provider();
        String providerUserId = socialUserInfo.providerUserId();

        Optional<OAuthAccount> oAuthAccountOptional =
                oAuthAccountRepository.findByProviderAndProviderUserId(provider, providerUserId);

        // 기존 회원이면 멤버id를 전달
        if (oAuthAccountOptional.isPresent()) {
            OAuthAccount oAuthAccount = oAuthAccountOptional.get();
            Long memberId = oAuthAccount.getMember().getId();

            return SocialLoginResult.existingMember(memberId);
        }

        // 신규 회원이면 signupTokenService 가
        // 1) signup token 생성
        // 2) Redis 에 SocialUserInfo 저장
        // 을 같이 처리합니다.
        try {
            String signupToken = signupTokenService.createSignupToken(socialUserInfo);
            return SocialLoginResult.newMember(signupToken);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("signup token 생성 실패", e);
        }
    }
}
