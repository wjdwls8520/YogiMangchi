package com.yogimangchi.global.config;

import com.yogimangchi.client.kis.KisProperties;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j // (1) 로그 남기기
@Configuration // (2) 설정 파일 지정
@RequiredArgsConstructor // (3) 생성자 자동 생성
@EnableConfigurationProperties(KisProperties.class)
public class WebClientConfig {

    private final KisProperties kisProperties; // (4) 우리가 만든 설정값 가져오기

    @Bean // (5) 스프링에게 "이거 관리해줘"라고 등록
    public WebClient kisWebClient() {

        // 1. 통신 연결 시간 설정 (무한 대기 방지)
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000) // 5초 안에 연결 안 되면 끊기
                .responseTimeout(Duration.ofSeconds(5)) // 응답이 5초 넘게 안 오면 끊기
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(5, TimeUnit.SECONDS))  // 읽기 시간초과
                            .addHandlerLast(new WriteTimeoutHandler(5, TimeUnit.SECONDS))); // 쓰기 시간초과

        // 2. 공용 WebClient 생성 및 반환
        return WebClient.builder()
                .baseUrl(kisProperties.baseUrl()) // 한투 서버 기본 주소
                .defaultHeader("Content-Type", "application/json") // "나 JSON 데이터 보낸다" 명찰
                .clientConnector(new ReactorClientHttpConnector(httpClient)) // 위에서 만든 타임아웃 설정 적용
                .build();
    }
}
