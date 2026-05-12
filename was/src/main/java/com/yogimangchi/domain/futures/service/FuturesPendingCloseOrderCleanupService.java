package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.event.LimitOrderRemovedEvent;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 포지션 청산 후 동일 포지션을 대상으로 등록되어 있던 PENDING LIMIT CLOSE 주문을 정리한다.
 *
 * 호출 컨텍스트
 *   - 강제청산 (FuturesLiquidationExecutionService): 잔여 수량 0 → 전량 일괄 취소
 *   - 시장가 청산 (FuturesOrderService): 부분/전체 청산 후 오버플로우 정리
 *   - 지정가 청산 체결 (FuturesLimitOrderExecutionService): 부분/전체 청산 후 오버플로우 정리
 *
 * 트랜잭션 전제
 *   - 반드시 호출 측의 트랜잭션 안에서 실행되어야 한다 (Propagation.MANDATORY).
 *   - 호출 측은 이미 지갑/포지션 락을 보유하고 있어야 한다. 같은 지갑의 다른 주문 변경 경로는
 *     모두 지갑 락을 먼저 획득하므로, 본 메서드의 벌크 UPDATE 가 외부 트랜잭션과 데드락을 일으키지 않는다.
 *
 * 처리 방식
 *   - 전량 청산: 단일 UPDATE 로 해당 지갑+심볼+방향의 모든 PENDING CLOSE 주문을 한 번에 CANCELED 로 전환
 *   - 부분 청산: 잔여 수량보다 미체결 합계가 큰 경우, 최신 주문부터 오버플로우 만큼 ID 를 모아 단일 UPDATE 로 일괄 취소
 *   - 영향 행 수를 모아 LimitOrderRemovedEvent 1회만 발행 (Registry 보유자 수를 count 만큼 한 번에 차감)
 */
@Service
@RequiredArgsConstructor
public class FuturesPendingCloseOrderCleanupService {

    private final FuturesOrderRepository futuresOrderRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(propagation = Propagation.MANDATORY)
    public void reconcilePendingCloseOrders(
            Assets wallet,
            String symbol,
            PositionSide positionSide,
            BigDecimal remainingQuantity
    ) {
        // 전량 청산 — 단일 UPDATE 로 일괄 취소
        if (remainingQuantity.compareTo(BigDecimal.ZERO) == 0) {
            int canceled = futuresOrderRepository.bulkCancelAllPendingCloseOrders(
                    wallet, symbol, positionSide, LocalDateTime.now()
            );
            if (canceled > 0) {
                eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol, canceled));
            }
            return;
        }

        // 부분 청산 — 잔여 수량 대비 미체결 합계가 큰 경우만 오버플로우 분량을 취소
        List<FuturesOrder> pendingCloseOrders = futuresOrderRepository.findAllPendingLimitCloseOrders(
                wallet, symbol, positionSide
        );
        if (pendingCloseOrders.isEmpty()) {
            return;
        }

        BigDecimal totalPendingQuantity = pendingCloseOrders.stream()
                .map(FuturesOrder::getOrderQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPendingQuantity.compareTo(remainingQuantity) <= 0) {
            return;
        }

        // 최신 주문부터 취소 — 먼저 등록한 주문을 보호하기 위함
        // 예) 잔여 5, 미체결 합계 10 (오래된 A=3, 최신 B=7). overflow=5.
        //     최신 B(7) 부터 취소하면 A(3)는 살아남아 잔여 포지션을 커버할 수 있음
        pendingCloseOrders.sort(
                Comparator.comparing(FuturesOrder::getCreatedAt)
                        .thenComparing(FuturesOrder::getId)
                        .reversed()
        );

        BigDecimal overflowQuantity = totalPendingQuantity.subtract(remainingQuantity);
        BigDecimal canceledQuantity = BigDecimal.ZERO;
        List<Long> idsToCancel = new ArrayList<>();

        for (FuturesOrder order : pendingCloseOrders) {
            if (canceledQuantity.compareTo(overflowQuantity) >= 0) {
                break;
            }
            idsToCancel.add(order.getId());
            canceledQuantity = canceledQuantity.add(order.getOrderQuantity());
        }

        if (idsToCancel.isEmpty()) {
            return;
        }

        int canceled = futuresOrderRepository.bulkCancelByIds(idsToCancel, LocalDateTime.now());
        if (canceled > 0) {
            eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol, canceled));
        }
    }
}
