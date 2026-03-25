package com.yogimangchi.global.auth.oauth.handler;

import com.yogimangchi.domain.auth.dto.SocialLoginResult;
import com.yogimangchi.domain.auth.service.AuthService;
import com.yogimangchi.domain.auth.service.SocialLoginService;
import com.yogimangchi.global.auth.jwt.dto.AuthTokens;
import com.yogimangchi.global.auth.jwt.service.AuthCookieService;
import com.yogimangchi.global.auth.oauth.dto.SocialUserInfo;
import com.yogimangchi.global.auth.oauth.principal.CustomOAuth2User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String FRONTEND_URL = "http://localhost:3000";

    private final SocialLoginService socialLoginService;
    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        CustomOAuth2User customOAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        SocialUserInfo socialUserInfo = customOAuth2User.getSocialUserInfo();

        SocialLoginResult result = socialLoginService.handleSocialLogin(socialUserInfo);

        if (result.existingMember()) {
            AuthTokens authTokens = authService.issueTokens(result.memberId());
            authCookieService.addAuthCookies(response, authTokens);
            clearSession(request, response);
            response.sendRedirect(FRONTEND_URL);
            return;
        }

        clearSession(request, response);
        response.sendRedirect(FRONTEND_URL + "/signup?token=" + result.signupToken());
    }

    private void clearSession(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);

        if (session != null) {
            session.invalidate();
        }

        authCookieService.expireSessionCookie(response);
    }
}
