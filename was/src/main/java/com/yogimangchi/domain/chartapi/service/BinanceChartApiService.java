package com.yogimangchi.domain.chartapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.chartapi.dto.BinanceTickerStreamMessage;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.client.ReactorNettyWebSocketClient;
import org.springframework.web.reactive.socket.client.WebSocketClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BinanceChartApiService {

    private static final Duration INITIAL_RETRY_DELAY = Duration.ofSeconds(3);
    private static final Duration MAX_RETRY_DELAY = Duration.ofSeconds(30);

    private final BinanceChartProperties binanceChartProperties;
    private final ChartPriceRepository chartPriceRepository;
    private final ObjectMapper objectMapper;

    private final WebSocketClient webSocketClient = new ReactorNettyWebSocketClient();
    private final AtomicBoolean started = new AtomicBoolean(false);

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        // 서버가 완전히 뜬 뒤, 바이낸스 공개 웹소켓 연결을 시작합니다.
        if (!started.compareAndSet(false, true)) {
            return;
        }

        Mono.defer(this::connectOnce)
                .retryWhen(Retry.backoff(Long.MAX_VALUE, INITIAL_RETRY_DELAY)
                        .maxBackoff(MAX_RETRY_DELAY)
                        .doBeforeRetry(signal -> log.warn("Binance 웹소켓 재연결 시도 {}회차: {}",
                                signal.totalRetries() + 1,
                                signal.failure().getMessage())))
                .subscribe();
    }

    public ChartPriceDto getPrice(String symbol) {
        return chartPriceRepository.findBySymbol(symbol)
                .orElse(null);
    }

    private Mono<Void> connectOnce() {
        // 여러 종목을 한 번에 받기 위해 combined stream 주소를 만듭니다.
        URI uri = URI.create(buildCombinedStreamUrl());

        return webSocketClient.execute(uri, session ->
                        session.receive()
                                .map(WebSocketMessage::getPayloadAsText)
                                .doOnSubscribe(subscription ->
                                        log.info("Binance 웹소켓 연결 성공: {}", uri))
                                .doOnNext(this::handleMessage)
                                .then())
                .then(Mono.error(new IllegalStateException("Binance 웹소켓 연결 종료")));
    }

    private String buildCombinedStreamUrl() {
        // 예:
        // btcusdt@ticker/ethusdt@ticker/xrpusdt@ticker
        //
        // ticker 채널은 "현재 최신 가격 정보"를 받는 용도입니다.
        String streams = binanceChartProperties.getTrackedSymbols().stream()
                .map(String::toLowerCase)
                .map(symbol -> symbol + "@ticker")
                .collect(Collectors.joining("/"));

        return binanceChartProperties.getWebsocketUrl() + "/stream?streams=" + streams;
    }

    private void handleMessage(String payload) {
        try {
            BinanceTickerStreamMessage message = objectMapper.readValue(payload, BinanceTickerStreamMessage.class);

            if (message.getData() == null || message.getData().getSymbol() == null) {
                return;
            }

            // 바이낸스 원본 응답을, 우리 서버에서 쓰기 쉬운 가격 DTO로 바꿉니다.
            ChartPriceDto price = new ChartPriceDto(
                    message.getData().getSymbol().toUpperCase(),
                    message.getData().getLastPrice(),
                    Instant.ofEpochMilli(message.getData().getEventTime()),
                    Instant.now()
            );

            // 같은 symbol이면 이전 값을 덮어써서 "최신 가격 1개"만 유지합니다.
            chartPriceRepository.save(price);
        } catch (Exception e) {
            log.warn("Binance 시세 메시지 파싱 실패: {}", e.getMessage());
        }
    }
}
