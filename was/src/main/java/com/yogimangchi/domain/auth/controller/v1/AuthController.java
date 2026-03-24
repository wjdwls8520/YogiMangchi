package com.yogimangchi.domain.auth.controller.v1;

import com.yogimangchi.domain.auth.dto.SignupInfoResponse;
import com.yogimangchi.domain.auth.dto.SignupRequest;
import com.yogimangchi.domain.auth.dto.SignupResponse;
import com.yogimangchi.domain.auth.service.AuthService;
import com.yogimangchi.domain.auth.service.SignupService;
import com.yogimangchi.global.auth.jwt.dto.AuthTokens;
import com.yogimangchi.global.auth.jwt.service.AuthCookieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증 및 회원가입 관련 API") // 도메인 구분
public class AuthController {

    private final SignupService signupService;
    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @Operation(summary = "소셜 유저 정보 조회", description = "(프로필 정보 보기에선 member api를 사용해야함) 신규 회원이 추가 정보 입력 폼에 진입했을 때, 소셜에서 받아온 기본 프로필을 띄워줄 목적으로 호출합니다.")
    @GetMapping("/signup-info")
    public ResponseEntity<SignupInfoResponse> getSignupInfo(@RequestParam("token") String token) {
        return ResponseEntity.ok(signupService.getSignupInfo(token));
    }

    @Operation(
            summary = "최종 회원가입 및 로그인",
            description = "회원 및 소셜계정 DB 저장 후 JWT를 발급합니다."
    )
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

    @Operation(summary = "토큰 갱신 (리프레시)", description = "액세스 토큰이 만료되었을 때 호출하여 토큰을 갱신합니다. 쿠키의 refresh_token을 자동으로 사용합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "갱신 성공 (헤더에 새 쿠키 발급)"),
            @ApiResponse(responseCode = "401", description = "리프레시 토큰 만료 또는 유효하지 않음 (다시 로그인 필요)")
    })
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request,
                                        HttpServletResponse response) {
        String refreshToken = resolveCookie(request, authCookieService.getRefreshTokenCookieName());
        AuthTokens authTokens = authService.refresh(refreshToken);
        authCookieService.addAuthCookies(response, authTokens);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "로그아웃", description = "DB의 리프레시 토큰을 삭제하고 브라우저의 쿠키를 만료시켜 로그아웃 처리합니다.")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
                                       HttpServletResponse response) {
        String refreshToken = resolveCookie(request, authCookieService.getRefreshTokenCookieName());
        authService.logout(refreshToken);
        authCookieService.expireAuthCookies(response);
        expireSession(request, response);
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    private void expireSession(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("JSESSIONID", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .sameSite("Lax")
                .maxAge(0)
                .build()
                .toString());
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
