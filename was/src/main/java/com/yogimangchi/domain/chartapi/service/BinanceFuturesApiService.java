package com.yogimangchi.domain.chartapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.chartapi.dto.BinanceFuturesStreamMessage;
import com.yogimangchi.domain.chartapi.repository.FuturesPriceRepository;
import com.yogimangchi.domain.futures.liquidation.FuturesLiquidationCoordinator;
import com.yogimangchi.domain.market.repository.FuturesSymbolPolicyRepository;
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
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class BinanceFuturesApiService {

    private static final String FUTURES_WEBSOCKET_BASE_URL = "wss://fstream.binance.com";
    private static final Duration INITIAL_RETRY_DELAY = Duration.ofSeconds(3);
    private static final Duration MAX_RETRY_DELAY = Duration.ofSeconds(30);

    private final FuturesSymbolPolicyRepository futuresSymbolPolicyRepository;
    private final FuturesPriceRepository futuresPriceRepository;
    private final FuturesLiquidationCoordinator futuresLiquidationCoordinator;
    private final ObjectMapper objectMapper;

    private final WebSocketClient webSocketClient = new ReactorNettyWebSocketClient();
    private final AtomicBoolean started = new AtomicBoolean(false);

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!started.compareAndSet(false, true)) {
            return;
        }

        List<String> symbols = futuresSymbolPolicyRepository.findAllSymbols();

        if (symbols.isEmpty()) {
            log.info("선물 심볼 없음 — Binance 선물 WebSocket 연결 생략");
            return;
        }

        String url = buildCombinedStreamUrl(symbols);

        Mono.defer(() -> connectOnce(url))
                .retryWhen(Retry.backoff(Long.MAX_VALUE, INITIAL_RETRY_DELAY)
                        .maxBackoff(MAX_RETRY_DELAY)
                        .doBeforeRetry(signal -> log.warn(
                                "Binance 선물 웹소켓 재연결 시도 {}회차: {}",
                                signal.totalRetries() + 1,
                                signal.failure().getMessage()
                        )))
                .subscribe();
    }

    private Mono<Void> connectOnce(String url) {
        URI uri = URI.create(url);

        return webSocketClient.execute(uri, session ->
                        session.receive()
                                .map(WebSocketMessage::getPayloadAsText)
                                .doOnSubscribe(sub -> log.info("Binance 선물 웹소켓 연결 성공: {}", uri))
                                .doOnNext(this::handleMessage)
                                .then())
                .then(Mono.error(new IllegalStateException("Binance 선물 웹소켓 연결 종료")));
    }

    // 선물 ticker + markPrice combined stream URL 생성
    // 예: wss://fstream.binance.com/stream?streams=btcusdt@ticker/btcusdt@markPrice/ethusdt@ticker/...
    private String buildCombinedStreamUrl(List<String> symbols) {
        String streams = symbols.stream()
                .map(String::toLowerCase)
                .flatMap(symbol -> Stream.of(symbol + "@ticker", symbol + "@markPrice"))
                .collect(Collectors.joining("/"));

        return FUTURES_WEBSOCKET_BASE_URL + "/stream?streams=" + streams;
    }

    private void handleMessage(String payload) {
        try {
            BinanceFuturesStreamMessage message = objectMapper.readValue(payload, BinanceFuturesStreamMessage.class);

            if (message.getData() == null || message.getData().getSymbol() == null) {
                return;
            }

            String symbol = message.getData().getSymbol().toUpperCase();
            String stream = message.getStream();

            if (stream.endsWith("@ticker")) {
                futuresPriceRepository.saveTickerPrice(symbol, message.getData().getLastPrice());
                log.debug("[선물 ticker] {} = {}", symbol, message.getData().getLastPrice());

            } else if (stream.endsWith("@markPrice")) {
                String markPrice = message.getData().getMarkPrice();
                futuresPriceRepository.saveMarkPrice(symbol, markPrice);
                futuresLiquidationCoordinator.onPriceTick(symbol, new BigDecimal(markPrice));
                log.debug("[선물 markPrice] {} = {}", symbol, markPrice);

            } else {
                log.debug("[선물 unknown stream] stream={}, payload={}", stream, payload);
            }

        } catch (Exception e) {
            log.warn("Binance 선물 시세 메시지 파싱 실패: {}", e.getMessage());
        }
    }
}
