package com.yogimangchi.global.config;

import com.yogimangchi.global.auth.jwt.filter.JwtAuthenticationFilter;
import com.yogimangchi.global.auth.oauth.handler.OAuth2SuccessHandler;
import com.yogimangchi.global.auth.oauth.service.CustomOAuth2UserService;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.RegexRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/",
                                "/error",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",          // 스웨거 UI HTML 페이지
                                "/swagger-ui.html",        // 스웨거 UI 접속 경로
                                "/oauth2/**",
                                "/login/**",
                                "/prices",

                                "/api/auth/**",
                                "/api/v1/auth/**",
                                // "/api/v1/chartapi/**",
                                "/api/v1/member/nickname/duplication",
                                "/api/v1/market/**",
                                "/api/v1/asset/mock/status"
                        ).permitAll()
                        // 내 정보 관련은 로그인 필요
                        .requestMatchers("/api/v1/member/me", "/api/v1/member/me/**").authenticated()

                        // 다른 멤버 프로필은 비회원도 조회 가능
                        .requestMatchers(new RegexRequestMatcher("^/api/v1/member/\\d+/info$", "GET")).permitAll()
                        .requestMatchers(new RegexRequestMatcher("^/api/v1/member/\\d+/followers$", "GET")).permitAll()
                        .requestMatchers(new RegexRequestMatcher("^/api/v1/member/\\d+/followings$", "GET")).permitAll()

                        // 커뮤니티 겟요청에 한해 전부 조회 가능
                        .requestMatchers(HttpMethod.GET, "/api/v1/community/**").permitAll() // 커뮤니티 조회는 비회원 허용
                        .anyRequest().authenticated()
                )
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                response.sendError(HttpServletResponse.SC_FORBIDDEN))
                )
                .oauth2Login(oauth -> oauth
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
