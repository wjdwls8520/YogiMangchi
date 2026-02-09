package com.yogimangchi.client.kis;

import com.yogimangchi.client.kis.dto.KisTokenRequest;
import com.yogimangchi.client.kis.dto.KisTokenResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Slf4j
@Component
@RequiredArgsConstructor
public class KisTokenManager {

    private final StringRedisTemplate redisTemplate;
    private final KisProperties kisProperties;
    private final WebClient kisWebClient;

    private static final String REDIS_KEY = "kis:access_token";

    private String localAccessToken;

    public String getAccessToken() {
        if (this.localAccessToken != null) {
            // log.info("변수에 토큰 확인 그대로 사용");
            return this.localAccessToken;
        }

        // localAccessToken에 토큰이 없다면 레디스 확인
        String redisToken = redisTemplate.opsForValue().get(REDIS_KEY);
        if (redisToken != null) {
            log.info("서버 재시작됨: Redis에서 토큰 복구 완료");
            this.localAccessToken = redisToken; // 다시 변수에 채워넣기
            return redisToken;
        }

        // 3. 둘 다 없으면 새로 발급
        log.info("Access Token 없음. 한투 API로 새로 발급 진행...");
        return issueAccessToken();
    }

    private String issueAccessToken() {
        KisTokenRequest request = new KisTokenRequest(
                "client_credentials",
                kisProperties.appKey(),
                kisProperties.appSecret()
        );

        KisTokenResponse response = kisWebClient.post()
                .uri("/oauth2/tokenP")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(KisTokenResponse.class)
                .block();

        if (response == null || response.getAccessToken() == null) {
            throw new RuntimeException("한투 토큰 발급 실패!");
        }

        String newToken = response.getAccessToken();
        log.info("새로운 Access Token 발급 완료: {}", newToken);

        // [저장] Redis에도 넣고(백업용), 내 변수에도 넣는다(실사용)
        redisTemplate.opsForValue().set(
                REDIS_KEY,
                newToken,
                Duration.ofSeconds(response.getExpiresIn() - 60)
        );
        this.localAccessToken = newToken; // 변수에 저장!

        return newToken;
    }
}