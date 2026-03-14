package com.yogimangchi.global.auth.oauth.service;

import com.yogimangchi.global.auth.oauth.dto.SocialUserInfo;
import com.yogimangchi.global.auth.oauth.principal.CustomOAuth2User;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oauth2User.getAttributes();

        SocialUserInfo socialUserInfo = extractSocialUserInfo(registrationId, attributes);

        return new CustomOAuth2User(socialUserInfo, attributes);
    }

    private SocialUserInfo extractSocialUserInfo(String registrationId, Map<String, Object> attributes) {
        if ("google".equals(registrationId)) {
            return extractGoogle(attributes);
        }

        if ("kakao".equals(registrationId)) {
            return extractKakao(attributes);
        }

        throw new OAuth2AuthenticationException("지원하지 않는 로그인 제공자입니다.");
    }

    // [ct] 서비스 정책
    private SocialUserInfo extractGoogle(Map<String, Object> attributes) {
        return new SocialUserInfo(
                "google",
                (String) attributes.get("sub"),
                (String) attributes.get("email"),
                (String) attributes.get("name"),
                (String) attributes.get("picture")
        );
    }

    @SuppressWarnings("unchecked")
    // [ct] 서비스 정책
    private SocialUserInfo extractKakao(Map<String, Object> attributes) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");

        String providerUserId = String.valueOf(attributes.get("id"));
        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        String nickname = properties != null ? (String) properties.get("nickname") : null;
        String profileImageUrl = properties != null ? (String) properties.get("profile_image") : null;

        return new SocialUserInfo(
                "kakao",
                providerUserId,
                email,
                nickname,
                profileImageUrl
        );
    }
}
