package com.yogimangchi.domain.trade.matching;

import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.trade.repository.OrderRepository;
import com.yogimangchi.domain.trade.service.LimitOrderExecutionService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

@Slf4j
@Component
@RequiredArgsConstructor
// 심볼별 지정가 주문 매칭 실행 조정 컴포넌트
public class LimitOrderMatchCoordinator {

    // 심볼별 한 번에 조회할 체결 후보 최대 개수
    private static final int MATCH_BATCH_SIZE = 100;

    private final LimitOrderSignalRegistry signalRegistry;
    private final OrderRepository orderRepository;
    private final ChartPriceRepository chartPriceRepository;
    private final LimitOrderExecutionService limitOrderExecutionService;

    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    // 실시간 가격 틱 기반 매칭 진입 지점
    public void onPriceTick(String symbol, BigDecimal price) {
        // 심볼별 가격 범위 누적
        signalRegistry.updatePriceWindow(symbol, price);

        if (!signalRegistry.hasOpenLimitOrder(symbol)) {
            return;
        }

        tryProcess(symbol);
    }

    // 보조 스케줄러 재시도 진입 지점
    public void requestReplay(String symbol) {
        if (!signalRegistry.hasOpenLimitOrder(symbol)) {
            return;
        }

        tryProcess(symbol);
    }

    // 동일 심볼 중복 처리 방지 게이트
    private void tryProcess(String symbol) {
        if (!signalRegistry.markProcessing(symbol)) {
            return;
        }

        // 심볼 단위 비동기 매칭 작업 위임
        executorService.submit(() -> processSymbol(symbol));
    }

    // 누적 가격 범위 소진 전까지 반복 처리
    private void processSymbol(String symbol) {
        try {
            while (true) {
                PriceWindow priceWindow = signalRegistry.drainPriceWindow(symbol);

                if (priceWindow == null) {
                    // 웹소켓 틱 누락 대비 최신 저장 가격 보정
                    ChartPriceDto latestPrice = chartPriceRepository.findBySymbol(symbol).orElse(null);
                    if (latestPrice == null) {
                        break;
                    }

                    priceWindow = PriceWindow.single(new BigDecimal(latestPrice.price()));
                }

                List<Long> executableOrderIds = findExecutableOrderIds(symbol, priceWindow);
                for (Long orderId : executableOrderIds) {
                    try {
                        limitOrderExecutionService.executeTriggeredOrder(orderId);
                    } catch (Exception exception) {
                        log.error("[지정가 주문 체결 실패] symbol={}, orderId={}, message={}",
                                symbol, orderId, exception.getMessage(), exception);
                    }
                }

                // 체결 후 남은 미체결 주문 존재 여부 동기화
                signalRegistry.syncOpenSymbol(symbol, orderRepository.existsOpenLimitOrderBySymbol(symbol));

                if (!signalRegistry.hasOpenLimitOrder(symbol) || !signalRegistry.hasPendingPriceWindow(symbol)) {
                    break;
                }
            }
        } catch (Exception exception) {
            log.error("[지정가 매칭 실패] symbol={}, message={}", symbol, exception.getMessage(), exception);
        } finally {
            signalRegistry.unmarkProcessing(symbol);

            // 처리 중 유입된 추가 가격 범위 재진입 처리
            if (signalRegistry.hasOpenLimitOrder(symbol) && signalRegistry.hasPendingPriceWindow(symbol)) {
                tryProcess(symbol);
            }
        }
    }

    // 매수·매도 체결 후보 통합 조회
    private List<Long> findExecutableOrderIds(String symbol, PriceWindow priceWindow) {
        List<Long> executableBuyOrderIds = orderRepository.findExecutableBuyLimitOrderIds(
                symbol,
                priceWindow.minPrice(),
                MATCH_BATCH_SIZE
        );
        List<Long> executableSellOrderIds = orderRepository.findExecutableSellLimitOrderIds(
                symbol,
                priceWindow.maxPrice(),
                MATCH_BATCH_SIZE
        );

        // 주문 생성 순서 보장을 위한 ID 오름차순 정렬
        return Stream.concat(executableBuyOrderIds.stream(), executableSellOrderIds.stream())
                .sorted()
                .toList();
    }

    @PreDestroy
    public void shutdown() {
        executorService.shutdown();
    }
}
