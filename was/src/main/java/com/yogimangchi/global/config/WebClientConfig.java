package com.yogimangchi.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient binanceWebClient(WebClient.Builder builder) {
        return builder
                .baseUrl("https://api.binance.com")
                // 바이낸스 API 응답이 클 경우를 대비해 메모리 버퍼 크기를 늘려줍니다. (기본 256KB -> 2MB)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
                .build();
    }
}