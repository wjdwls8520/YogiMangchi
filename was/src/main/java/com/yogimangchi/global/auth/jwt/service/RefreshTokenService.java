package com.yogimangchi.global.auth.jwt.service;

import com.yogimangchi.global.auth.jwt.config.JwtProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String REFRESH_TOKEN_PREFIX = "auth:refresh:";

    private final StringRedisTemplate stringRedisTemplate;
    private final JwtProperties jwtProperties;

    public void saveRefreshToken(Long memberId, String refreshToken) {
        stringRedisTemplate.opsForValue().set(
                buildKey(memberId),
                refreshToken,
                Duration.ofMillis(jwtProperties.getRefreshTokenExpireMs())
        );
    }

    public boolean matches(Long memberId, String refreshToken) {
        String savedRefreshToken = stringRedisTemplate.opsForValue().get(buildKey(memberId));
        return Objects.equals(savedRefreshToken, refreshToken);
    }

    public void removeRefreshToken(Long memberId) {
        stringRedisTemplate.delete(buildKey(memberId));
    }

    private String buildKey(Long memberId) {
        return REFRESH_TOKEN_PREFIX + memberId;
    }
}
