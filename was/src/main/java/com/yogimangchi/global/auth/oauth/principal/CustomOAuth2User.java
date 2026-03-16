package com.yogimangchi.global.auth.oauth.principal;

import com.yogimangchi.global.auth.oauth.dto.SocialUserInfo;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {

    private final SocialUserInfo socialUserInfo;
    private final Map<String, Object> attributes;

    public CustomOAuth2User(SocialUserInfo socialUserInfo, Map<String, Object> attributes) {
        this.socialUserInfo = socialUserInfo;
        this.attributes = attributes;
    }

    public SocialUserInfo getSocialUserInfo() {
        return socialUserInfo;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    @Override
    public String getName() {
        return socialUserInfo.providerUserId();
    }
}
