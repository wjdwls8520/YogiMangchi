package com.yogimangchi.global.config;

import com.yogimangchi.global.auth.oauth.handler.OAuth2SuccessHandler;
import com.yogimangchi.global.auth.oauth.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity // Spring Security 웹 보안을 명시적으로 켬
@RequiredArgsConstructor
public class SecurityConfig {

    // [ct]
    private final CustomOAuth2UserService customOAuth2UserService;
    // [ct]
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // [ct] CSRF 보호 비활성화, 지금은 API/학습 단계라 단순화하려고 끄는 것
                .formLogin(form -> form.disable()) // 기본 로그인 폼 비활성화, 우리는 ID/PW 폼 로그인을 안 쓸 거라서 끔
                .httpBasic(basic -> basic.disable()) // 브라우저 기본 팝업 로그인 비활성화, 사용x
                .authorizeHttpRequests(auth -> auth // 인증된 사용자만 들어오게 함
                        // [ct] 어떤 URL을 열어둘지
                        .requestMatchers(
                                "/",
                                "/error",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/oauth2/**",
                                "/login/**",
                                "/api/auth/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                // 구글/카카오 OAuth 로그인 기능 활성화

                //.oauth2Login(Customizer.withDefaults()); 전부 기본값 사용
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo // 로그인 성공 후 CustomOAuth2UserService 에게 토스
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(oAuth2SuccessHandler)
                );

        return http.build();
    }
}
