package com.yogimangchi.global.auth.oauth.handler;

import com.yogimangchi.global.auth.oauth.dto.SocialUserInfo;
import com.yogimangchi.global.auth.oauth.principal.CustomOAuth2User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal(); // Spring Security가 로그인 성공 후 들고 있는 사용자 객체를 꺼냅니다.
        SocialUserInfo socialUserInfo = customOAuth2User.getSocialUserInfo(); // 우리가 직접 만든 사용자 객체로 바꿉니다. 그 안에 들어있는 공통 DTO를 꺼냅니다.

        String provider = socialUserInfo.provider();
        String providerUserId = socialUserInfo.providerUserId();
        String email = socialUserInfo.email();
        String nickname = socialUserInfo.nickname();

        System.out.println("로그인 성공");
        System.out.println("provider = " + provider);
        System.out.println("providerUserId = " + providerUserId);
        System.out.println("email = " + email);
        System.out.println("nickname = " + nickname);

        response.sendRedirect("http://localhost:3000"); // 일단 로그인 성공 후 프론트 메인으로 보냅니다.
    }
}
