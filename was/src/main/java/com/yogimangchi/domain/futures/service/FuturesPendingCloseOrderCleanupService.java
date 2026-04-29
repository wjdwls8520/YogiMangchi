package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.event.LimitOrderRemovedEvent;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FuturesPendingCloseOrderCleanupService {

    private final FuturesOrderRepository futuresOrderRepository;
    private final ApplicationEventPublisher eventPublisher;

    public void reconcilePendingCloseOrders(
            Assets wallet,
            String symbol,
            PositionSide positionSide,
            BigDecimal remainingQuantity
    ) {
        List<FuturesOrder> pendingCloseOrders = futuresOrderRepository.findAllPendingLimitCloseOrders(
                wallet, symbol, positionSide
        );

        if (pendingCloseOrders.isEmpty()) {
            return;
        }

        if (remainingQuantity.compareTo(BigDecimal.ZERO) == 0) {
            cancelOrders(pendingCloseOrders, symbol);
            return;
        }

        BigDecimal totalPendingQuantity = pendingCloseOrders.stream()
                .map(FuturesOrder::getOrderQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPendingQuantity.compareTo(remainingQuantity) <= 0) {
            return;
        }

        // 최신 주문부터 취소 — 먼저 등록한 주문을 보호하기 위함
        // 예) 포지션 10개 중 5개 부분청산 → 잔여 5개. PENDING CLOSE 합계 10개일 때
        //     오래된 주문(A:3개)을 살리고, 최신 주문(B:7개)부터 취소하면 A가 살아남아 잔여 포지션을 커버
        //     반대로 오래된 것부터 취소하면 A도 B도 모두 취소되어 잔여 포지션 미커버
        pendingCloseOrders.sort(
                Comparator.comparing(FuturesOrder::getCreatedAt)
                        .thenComparing(FuturesOrder::getId)
                        .reversed()
        );

        BigDecimal overflowQuantity = totalPendingQuantity.subtract(remainingQuantity);
        BigDecimal canceledQuantity = BigDecimal.ZERO;

        LocalDateTime canceledAt = LocalDateTime.now();
        for (FuturesOrder pendingCloseOrder : pendingCloseOrders) {
            if (canceledQuantity.compareTo(overflowQuantity) >= 0) {
                break;
            }
            // Coordinator가 동시에 체결 처리했을 수 있으므로 PENDING 상태 재확인
            if (pendingCloseOrder.getOrderStatus() != OrderStatus.PENDING) {
                continue;
            }
            pendingCloseOrder.cancel(canceledAt);
            canceledQuantity = canceledQuantity.add(pendingCloseOrder.getOrderQuantity());
            eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol));
        }
    }

    private void cancelOrders(List<FuturesOrder> orders, String symbol) {
        LocalDateTime canceledAt = LocalDateTime.now();
        for (FuturesOrder order : orders) {
            // Coordinator가 동시에 체결 처리했을 수 있으므로 PENDING 상태 재확인
            if (order.getOrderStatus() != OrderStatus.PENDING) {
                continue;
            }
            order.cancel(canceledAt);
            eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol));
        }
    }
}
