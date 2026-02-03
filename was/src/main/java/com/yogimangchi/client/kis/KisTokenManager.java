package com.yogimangchi.client.kis;

import com.yogimangchi.client.kis.dto.KisTokenRequest;
import com.yogimangchi.client.kis.dto.KisTokenResponse;
import lombok.RequiredArgsConstructor; // 이거 쓰면 생성자 코드 줄일 수 있음
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor // 생성자 자동 생성 (Lombok)
public class KisTokenManager implements ApplicationRunner {

    // WebClient는 여기서 미리 선언하지 않음 (제거)
    private final KisProperties kisProperties;
    private final StringRedisTemplate redisTemplate;

    private String accessToken;
    private static final String REDIS_KEY = "kis:token";

    @Override
    public void run(ApplicationArguments args) {
        log.info("🚀 [KIS] 토큰 관리자 시작");

        // 1. 설정값 제대로 들어왔는지 로그로 확인 (디버깅용)
        log.info("설정된 BaseURL: {}", kisProperties.baseUrl());

        String savedToken = redisTemplate.opsForValue().get(REDIS_KEY);

        if (savedToken != null) {
            log.info("[Redis] 기존 토큰 사용: {}", savedToken.substring(0, 10) + "...");
            this.accessToken = savedToken;
        } else {
            issueNewToken();
        }
    }

    private void issueNewToken() {
        try {
            // 사용할 때 WebClient 생성 (Lazy Initialization)
            // 이때는 이미 모든 설정이 로딩된 후라서 훨씬 안전함
            WebClient webClient = WebClient.create(kisProperties.baseUrl());

            KisTokenResponse response = webClient.post()
                    .uri("/oauth2/tokenP")
                    .bodyValue(new KisTokenRequest(
                            "client_credentials",
                            kisProperties.appKey(),
                            kisProperties.appSecret()
                    ))
                    .retrieve()
                    .bodyToMono(KisTokenResponse.class)
                    .block();

            if (response != null) {
                this.accessToken = response.access_token();
                redisTemplate.opsForValue().set(REDIS_KEY, this.accessToken, Duration.ofHours(23));
                log.info("토큰 발급 성공 및 Redis 저장 완료");
            }
        } catch (Exception e) {
            log.error("토큰 발급 실패! 설정을 확인해주세요.", e);
            // 여기서 null이면 로그에 정확히 찍힘
        }
    }

    public String getAccessToken() {
        if (this.accessToken == null) {
            this.accessToken = redisTemplate.opsForValue().get(REDIS_KEY);
        }
        return this.accessToken;
    }
}