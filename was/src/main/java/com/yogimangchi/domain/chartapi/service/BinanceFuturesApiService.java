package com.yogimangchi.domain.chartapi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yogimangchi.domain.chartapi.dto.BinanceFuturesStreamMessage;
import com.yogimangchi.domain.chartapi.repository.FuturesPriceRepository;
import com.yogimangchi.domain.futures.limitTradeEngine.FuturesLimitOrderCoordinator;
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
    private final FuturesLimitOrderCoordinator futuresLimitOrderCoordinator;
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

    // 선물 ticker stream URL 생성
    // 예: wss://fstream.binance.com/market/stream?streams=btcusdt@ticker/ethusdt@ticker/...
    // **** 최근 wss://fstream.binance.com/... 에서 wss://fstream.binance.com/market/... 으로 변경됨 (몇년에 한번씩 변경될 수 있음을 주의)
    private String buildCombinedStreamUrl(List<String> symbols) {
        String streams = symbols.stream()
                .map(String::trim)
                .map(String::toLowerCase)
                .map(symbol -> symbol + "@ticker")
                .collect(Collectors.joining("/"));

        return FUTURES_WEBSOCKET_BASE_URL + "/market" + "/stream?streams=" + streams;
    }

    private void handleMessage(String payload) {
        // [진단] 메시지 수신 자체를 가시화 — 시나리오 A(메시지 안 옴) 판별용
        // log.info("[선물 WebSocket 수신] len={}", payload == null ? "null" : payload.length());
        try {
            BinanceFuturesStreamMessage message = objectMapper.readValue(payload, BinanceFuturesStreamMessage.class);

            // [진단] 기존엔 silent return이던 경로를 가시화
            if (message.getData() == null) {
                log.info("[선물 진단 - data null] payload={}", payload);
                return;
            }
            if (message.getData().getSymbol() == null) {
                log.warn("[선물 진단 - symbol null] payload={}", payload);
                return;
            }

            String symbol = message.getData().getSymbol().toUpperCase();
            String stream = message.getStream();

            // [진단] stream null 케이스도 가시화 (NPE 방어)
            if (stream == null) {
                log.warn("[선물 진단 - stream null] symbol={}, payload={}", symbol, payload);
                return;
            }

            if (stream.endsWith("@ticker")) {
                String tickerPrice = message.getData().getLastPrice();

                // 시나리오 3: lastPrice가 null
                if (tickerPrice == null || tickerPrice.isBlank()) {
                    log.warn("[선물 ticker] lastPrice가 null — symbol={}, payload={}", symbol, payload);
                    return;
                }

                futuresPriceRepository.saveTickerPrice(symbol, tickerPrice);
                // 선물 @ticker 가격으로 지정가 체결 + 강제청산 모두 판단
                futuresLimitOrderCoordinator.onPriceTick(symbol, new BigDecimal(tickerPrice));
                futuresLiquidationCoordinator.onPriceTick(symbol, new BigDecimal(tickerPrice));

                // 시나리오 5: 정상 저장 성공 — DEBUG → INFO 승격하여 가시화
                // log.info("[선물 ticker 저장 성공] {} = {}", symbol, tickerPrice);

            } else {
                // 시나리오 4: 알 수 없는 스트림
                log.warn("[선물 unknown stream] stream={}, payload={}", stream, payload);
            }

        } catch (Exception e) {
            // 시나리오 2: 파싱 실패 — WARN → ERROR 승격하여 강조
            log.error("[선물 시세 메시지 파싱 실패] error={}, payload={}", e.getMessage(), payload, e);
        }
    }
}
