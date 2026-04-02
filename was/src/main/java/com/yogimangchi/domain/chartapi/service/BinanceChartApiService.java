package com.yogimangchi.domain.chartapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.chartapi.dto.BinanceTickerStreamMessage;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.trade.matching.LimitOrderMatchCoordinator;
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

import java.math.BigDecimal;
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
    private final LimitOrderMatchCoordinator limitOrderMatchCoordinator;
    private final ObjectMapper objectMapper;

    private final WebSocketClient webSocketClient = new ReactorNettyWebSocketClient();
    private final AtomicBoolean started = new AtomicBoolean(false);

    // 애플리케이션 기동 후 웹소켓 구독 시작
    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!started.compareAndSet(false, true)) {
            return;
        }

        // 연결 종료 시 무한 재시도 스트림
        Mono.defer(this::connectOnce)
                .retryWhen(Retry.backoff(Long.MAX_VALUE, INITIAL_RETRY_DELAY)
                        .maxBackoff(MAX_RETRY_DELAY)
                        .doBeforeRetry(signal -> log.warn(
                                "Binance 웹소켓 재연결 시도 {}회차: {}",
                                signal.totalRetries() + 1,
                                signal.failure().getMessage()
                        )))
                .subscribe();
    }

    public ChartPriceDto getPrice(String symbol) {
        return chartPriceRepository.findBySymbol(symbol).orElse(null);
    }

    // 단일 연결 수명주기 처리
    private Mono<Void> connectOnce() {
        URI uri = URI.create(buildCombinedStreamUrl());

        return webSocketClient.execute(uri, session ->
                        session.receive()
                                .map(WebSocketMessage::getPayloadAsText)
                                .doOnSubscribe(subscription -> log.info("Binance 웹소켓 연결 성공: {}", uri))
                                .doOnNext(this::handleMessage)
                                .then())
                .then(Mono.error(new IllegalStateException("Binance 웹소켓 연결 종료")));
    }

    // 추적 심볼 대상 결합 스트림 URL 생성
    private String buildCombinedStreamUrl() {
        String streams = binanceChartProperties.getTrackedSymbols().stream()
                .map(String::toLowerCase)
                .map(symbol -> symbol + "@ticker")
                .collect(Collectors.joining("/"));

        return binanceChartProperties.getWebsocketUrl() + "/stream?streams=" + streams;
    }

    // 유효한 티커 메시지 저장 및 매칭 전달
    private void handleMessage(String payload) {
        try {
            BinanceTickerStreamMessage message = objectMapper.readValue(payload, BinanceTickerStreamMessage.class);

            if (message.getData() == null || message.getData().getSymbol() == null) {
                return;
            }

            ChartPriceDto price = new ChartPriceDto(
                    message.getData().getSymbol().toUpperCase(),
                    message.getData().getLastPrice(),
                    Instant.ofEpochMilli(message.getData().getEventTime()),
                    Instant.now()
            );

            chartPriceRepository.save(price);
            limitOrderMatchCoordinator.onPriceTick(price.symbol(), new BigDecimal(price.price()));
        } catch (Exception e) {
            log.warn("Binance 시세 메시지 파싱 실패: {}", e.getMessage());
        }
    }
}
