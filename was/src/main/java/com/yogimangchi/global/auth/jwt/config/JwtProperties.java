package com.yogimangchi.global.auth.jwt.config;

import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@Getter
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    // application.yml 의 jwt.secret 값을 받습니다.
    // 실제 값은 ${JWT_SECRET} 환경변수에서 들어옵니다.
    private String secret;

    // access token 만료시간(ms) 입니다.
    private long accessTokenExpireMs;

    // refresh token 만료시간(ms) 입니다.
    private long refreshTokenExpireMs;

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public void setAccessTokenExpireMs(long accessTokenExpireMs) {
        this.accessTokenExpireMs = accessTokenExpireMs;
    }

    public void setRefreshTokenExpireMs(long refreshTokenExpireMs) {
        this.refreshTokenExpireMs = refreshTokenExpireMs;
    }
}
