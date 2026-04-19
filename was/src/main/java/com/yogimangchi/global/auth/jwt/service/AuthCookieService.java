package com.yogimangchi.global.auth.jwt.service;

import com.yogimangchi.global.auth.jwt.config.JwtProperties;
import com.yogimangchi.global.auth.jwt.dto.AuthTokens;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthCookieService {

    private static final String ACCESS_TOKEN_COOKIE_NAME = "access_token";
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    private static final String SESSION_COOKIE_NAME = "JSESSIONID";
    private static final boolean COOKIE_SECURE = false;

    private final JwtProperties jwtProperties;

    public void addAuthCookies(HttpServletResponse response, AuthTokens authTokens) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildAccessTokenCookie(authTokens.accessToken()).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(authTokens.refreshToken()).toString());
    }

    public void expireAuthCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie(ACCESS_TOKEN_COOKIE_NAME).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie(REFRESH_TOKEN_COOKIE_NAME).toString());
    }

    public void expireAccessTokenCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie(ACCESS_TOKEN_COOKIE_NAME).toString());
    }

    public void expireSessionCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie(SESSION_COOKIE_NAME).toString());
    }

    public String getAccessTokenCookieName() {
        return ACCESS_TOKEN_COOKIE_NAME;
    }

    public String getRefreshTokenCookieName() {
        return REFRESH_TOKEN_COOKIE_NAME;
    }

    private ResponseCookie buildAccessTokenCookie(String accessToken) {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE_NAME, accessToken)
                .httpOnly(true)
                .secure(COOKIE_SECURE)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofMillis(jwtProperties.getAccessTokenExpireMs()))
                .build();
    }

    private ResponseCookie buildRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(COOKIE_SECURE)
                .path("/")
                .sameSite("Lax")
                .maxAge(Duration.ofMillis(jwtProperties.getRefreshTokenExpireMs()))
                .build();
    }

    private ResponseCookie deleteCookie(String cookieName) {
        return ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(COOKIE_SECURE)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build();
    }
}
