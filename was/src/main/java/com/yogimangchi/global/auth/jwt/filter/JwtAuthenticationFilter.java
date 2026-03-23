package com.yogimangchi.global.auth.jwt.filter;

import com.yogimangchi.domain.auth.service.AuthService;
import com.yogimangchi.global.auth.jwt.dto.AuthTokens;
import com.yogimangchi.global.auth.jwt.service.AuthCookieService;
import com.yogimangchi.global.auth.jwt.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        return requestUri.startsWith("/oauth2/")
                || requestUri.startsWith("/login/")
                || requestUri.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String accessToken = resolveCookie(request, authCookieService.getAccessTokenCookieName());

            if (accessToken == null) {
                tryRefreshToken(request, response);
                filterChain.doFilter(request, response);
                return;
            }

            if (jwtService.validateToken(accessToken)) {
                setAuthentication(jwtService.extractMemberId(accessToken), request);
                filterChain.doFilter(request, response);
                return;
            }

            tryRefreshToken(request, response);
        }

        filterChain.doFilter(request, response);
    }

    private void tryRefreshToken(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = resolveCookie(request, authCookieService.getRefreshTokenCookieName());

        if (refreshToken == null) {
            return;
        }

        try {
            AuthTokens authTokens = authService.refresh(refreshToken);
            authCookieService.addAuthCookies(response, authTokens);
            setAuthentication(jwtService.extractMemberId(authTokens.accessToken()), request);
        } catch (IllegalArgumentException ignored) {
        }
    }

    private void setAuthentication(Long memberId, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        memberId,  // ✨ String 변환 없이 깔끔하게 진짜 Long 객체를 통째로 넘김!
                        null,
                        Collections.emptyList()
                );

        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String resolveCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if (cookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}
