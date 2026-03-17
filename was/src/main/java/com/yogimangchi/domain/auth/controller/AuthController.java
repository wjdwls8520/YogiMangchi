package com.yogimangchi.domain.auth.controller;

import com.yogimangchi.domain.auth.dto.SignupInfoResponse;
import com.yogimangchi.domain.auth.dto.SignupRequest;
import com.yogimangchi.domain.auth.dto.SignupResponse;
import com.yogimangchi.domain.auth.service.AuthService;
import com.yogimangchi.domain.auth.service.SignupService;
import com.yogimangchi.global.auth.jwt.dto.AuthTokens;
import com.yogimangchi.global.auth.jwt.service.AuthCookieService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SignupService signupService;
    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @GetMapping("/signup-info")
    public ResponseEntity<SignupInfoResponse> getSignupInfo(@RequestParam("token") String token) {
        return ResponseEntity.ok(signupService.getSignupInfo(token));
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(
        @RequestBody SignupRequest signupRequest,
        HttpServletResponse response
    ) {
        SignupResponse signupResponse = signupService.signup(signupRequest);
        AuthTokens authTokens = authService.issueTokens(signupResponse.memberId());
        authCookieService.addAuthCookies(response, authTokens);
        return ResponseEntity.ok(signupResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request,
                                        HttpServletResponse response) {
        String refreshToken = resolveCookie(request, authCookieService.getRefreshTokenCookieName());
        AuthTokens authTokens = authService.refresh(refreshToken);
        authCookieService.addAuthCookies(response, authTokens);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                       HttpServletResponse response) {
        String refreshToken = resolveCookie(request, authCookieService.getRefreshTokenCookieName());
        authService.logout(refreshToken);
        authCookieService.expireAuthCookies(response);
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
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
