package com.yogimangchi.global.auth.jwt.service;

import com.yogimangchi.global.auth.jwt.config.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;

        // JwtProperties 가 들고 있는 secret 문자열은 Base64 문자열입니다.
        // 그래서 먼저 Base64 디코딩을 하고,
        // 그 바이트 배열로 JWT 서명용 SecretKey 를 만듭니다.
        this.secretKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(jwtProperties.getSecret())
        );
    }

    public String createAccessToken(Long memberId) {
        return Jwts.builder()
                // subject 에는 사용자를 식별할 값인 memberId 를 넣습니다.
                .subject(String.valueOf(memberId))
                // 토큰 발급 시간입니다.
                .issuedAt(new Date())
                // access token 만료 시간입니다.
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getAccessTokenExpireMs()))
                // 위에서 만든 SecretKey 로 서명합니다.
                .signWith(secretKey)
                .compact();
    }

    public String createRefreshToken(Long memberId) {
        return Jwts.builder()
                // refresh token 도 어떤 회원의 토큰인지 알아야 하므로 memberId 를 넣습니다.
                .subject(String.valueOf(memberId))
                .issuedAt(new Date())
                // refresh token 만료 시간입니다.
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getRefreshTokenExpireMs()))
                .signWith(secretKey)
                .compact();
    }
}
