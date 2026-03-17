package com.yogimangchi.global.auth.oauth.handler;

import com.yogimangchi.domain.auth.dto.SocialLoginResult;
import com.yogimangchi.domain.auth.service.SocialLoginService;
import com.yogimangchi.global.auth.jwt.config.JwtProperties;
import com.yogimangchi.global.auth.jwt.service.JwtService;
import com.yogimangchi.global.auth.oauth.dto.SocialUserInfo;
import com.yogimangchi.global.auth.oauth.principal.CustomOAuth2User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final SocialLoginService socialLoginService;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        SocialUserInfo socialUserInfo = customOAuth2User.getSocialUserInfo();

        SocialLoginResult result = socialLoginService.handleSocialLogin(socialUserInfo);

        // 기존 회원이면 JWT 를 만들어 쿠키로 내려주고 메인으로 보냅니다.
        if (result.existingMember()) {
            String accessToken = jwtService.createAccessToken(result.memberId());
            String refreshToken = jwtService.createRefreshToken(result.memberId());

            ResponseCookie accessTokenCookie = ResponseCookie.from("access_token", accessToken)
                    .httpOnly(true)
                    .secure(false) // 로컬 개발용, 운영에서는 true
                    .path("/")
                    .sameSite("Lax")
                    .maxAge(Duration.ofMillis(jwtProperties.getAccessTokenExpireMs()))
                    .build();

            ResponseCookie refreshTokenCookie = ResponseCookie.from("refresh_token", refreshToken)
                    .httpOnly(true)
                    .secure(false) // 로컬 개발용, 운영에서는 true
                    .path("/")
                    .sameSite("Lax")
                    .maxAge(Duration.ofMillis(jwtProperties.getRefreshTokenExpireMs()))
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
            response.sendRedirect("http://localhost:3000");
            return;
        }

        // 신규 회원이면 Redis 에 저장된 signup token 을 들고 회원가입 페이지로 이동합니다.
        response.sendRedirect("http://localhost:3000/signup?token=" + result.signupToken());
    }
}
