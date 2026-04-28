package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
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

        pendingCloseOrders.sort(
                Comparator.comparing(FuturesOrder::getCreatedAt)
                        .thenComparing(FuturesOrder::getId)
                        .reversed()
        );

        BigDecimal overflowQuantity = totalPendingQuantity.subtract(remainingQuantity);
        BigDecimal canceledQuantity = BigDecimal.ZERO;

        for (FuturesOrder pendingCloseOrder : pendingCloseOrders) {
            if (canceledQuantity.compareTo(overflowQuantity) >= 0) {
                break;
            }
            pendingCloseOrder.cancel(LocalDateTime.now());
            canceledQuantity = canceledQuantity.add(pendingCloseOrder.getOrderQuantity());
            eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol));
        }
    }

    private void cancelOrders(List<FuturesOrder> orders, String symbol) {
        LocalDateTime canceledAt = LocalDateTime.now();
        for (FuturesOrder order : orders) {
            order.cancel(canceledAt);
            eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol));
        }
    }
}
