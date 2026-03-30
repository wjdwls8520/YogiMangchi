package com.yogimangchi.global.auth.jwt.service;

import com.yogimangchi.domain.member.enums.MemberRole;
import io.jsonwebtoken.Claims;
import com.yogimangchi.global.auth.jwt.config.JwtProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private static final String ROLE_CLAIM_NAME = "role";

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtProperties.getSecret()));
    }

    public String createAccessToken(Long memberId, MemberRole role) {
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .claim(ROLE_CLAIM_NAME, role.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getAccessTokenExpireMs()))
                .signWith(secretKey)
                .compact();
    }

    public String createRefreshToken(Long memberId) {
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtProperties.getRefreshTokenExpireMs()))
                .signWith(secretKey)
                .compact();
    }

    public Long extractMemberId(String token) {
        String subject = parseClaims(token).getSubject();

        return Long.valueOf(subject);
    }

    public MemberRole extractRole(String token) {
        String roleName = parseClaims(token).get(ROLE_CLAIM_NAME, String.class);

        if (roleName == null || roleName.isBlank()) {
            throw new IllegalArgumentException("access token 에 role claim 이 없습니다.");
        }

        try {
            return MemberRole.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 role claim 입니다.");
        }
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
