package com.yogimangchi.domain.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.auth.dto.SignupTokenPayload;
import com.yogimangchi.domain.member.enums.MemberRole;
import com.yogimangchi.global.auth.oauth.dto.SocialUserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SignupTokenService {

    private static final Duration SIGNUP_TOKEN_TTL = Duration.ofMinutes(10);
    private static final String SIGNUP_TOKEN_PREFIX = "auth:signup:";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    public String createSignupToken(SocialUserInfo socialUserInfo) throws JsonProcessingException {
        String token = UUID.randomUUID().toString();
        String key = buildKey(token);

        SignupTokenPayload signupTokenPayload = new SignupTokenPayload(
                socialUserInfo.email(),
                MemberRole.USER.name(),
                socialUserInfo.provider(),
                socialUserInfo.providerUserId(),
                socialUserInfo.nickname(),
                socialUserInfo.profileImageUrl(),
                LocalDateTime.now()
        );

        String value = objectMapper.writeValueAsString(signupTokenPayload);
        stringRedisTemplate.opsForValue().set(key, value, SIGNUP_TOKEN_TTL);
        return token;
    }

    public SignupTokenPayload getSignupTokenPayload(String token) throws JsonProcessingException {
        String value = stringRedisTemplate.opsForValue().get(buildKey(token));

        if (value == null) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 signup token 입니다.");
        }

        return objectMapper.readValue(value, SignupTokenPayload.class);
    }

    public void removeSignupToken(String token) {
        stringRedisTemplate.delete(buildKey(token));
    }

    private String buildKey(String token) {
        return SIGNUP_TOKEN_PREFIX + token;
    }
}
