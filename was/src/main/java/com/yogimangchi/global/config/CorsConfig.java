package com.yogimangchi.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                        "http://localhost:3000"
//                       , "https:adsd.com"  나중에 배포할 진짜 도메인
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true) // 쿠키 또는 인증 헤더 허용
                .maxAge(3600);  // 브라우저가 3600 (1시간) 동안 이 설정을 기억함.
    }
}
