package com.yogimangchi.domain.trade.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.trade.constant.TradeFeePolicy;
import com.yogimangchi.domain.trade.entity.Order;
import com.yogimangchi.domain.trade.entity.TradeHistory;
import com.yogimangchi.domain.trade.enums.OrderStatus;
import com.yogimangchi.domain.trade.matching.LimitOrderSignalRegistry;
import com.yogimangchi.domain.trade.repository.OrderRepository;
import com.yogimangchi.domain.trade.repository.TradeHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
// 지정가 주문 체결 처리 서비스
public class LimitOrderExecutionService {

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final TradeHistoryRepository tradeHistoryRepository;
    private final LimitOrderSignalRegistry limitOrderSignalRegistry;

    // 지정가 주문 체결 진입 로직
    @Transactional
    public void executeTriggeredOrder(Long orderId) {
        Order order = orderRepository.findByIdForExecution(orderId)
                .orElseThrow(() -> new IllegalArgumentException("체결 대상 주문을 찾을 수 없습니다."));

        if (!"LIMIT".equals(order.getOrderType())) {
            throw new IllegalArgumentException("지정가 주문만 체결 서비스의 대상입니다.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            log.info("[지정가 체결 스킵] orderId={}, status={}", orderId, order.getStatus());
            return;
        }

        // 체결 처리용 지갑 행 잠금 확보
        Assets wallet = assetRepository.findByIdForUpdate(order.getAssets().getId())
                .orElseThrow(() -> new IllegalArgumentException("주문에 연결된 지갑을 찾을 수 없습니다."));

        if ("BUY".equals(order.getSide())) {
            executeLimitBuy(order, wallet);
            return;
        }

        if ("SELL".equals(order.getSide())) {
            executeLimitSell(order, wallet);
            return;
        }

        throw new IllegalArgumentException("지원하지 않는 매매 방향입니다.");
    }

    // 지정가 매수 체결 로직
    private void executeLimitBuy(Order order, Assets wallet) {
        // 남은 수량 전체 체결 기준 정산 값 계산
        BigDecimal filledQuantity = order.getRemainingQuantity();
        BigDecimal executedAmount = order.getOrderPrice()
                .multiply(filledQuantity)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal fee = TradeFeePolicy.calculateFee(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);
        BigDecimal reservedAmount = TradeFeePolicy.calculateReservationAmount(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);

        // 주문 시 예약한 원금 + 수수료 소진
        wallet.consumeLockedMoney(reservedAmount);

        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, order.getSymbol())
                .orElse(null);

        // 신규 보유 생성과 기존 보유 갱신 분기 처리
        if (holding == null) {
            holdingRepository.save(
                    Holding.createFirstHolding(wallet, order.getSymbol(), filledQuantity, order.getOrderPrice())
            );
        } else {
            // 잠금 수량 포함 평균 매수가 재계산
            BigDecimal totalQuantityBeforeBuy = holding.getQuantity().add(holding.getLockedQuantity());
            BigDecimal totalBuyAmountBeforeBuy = totalQuantityBeforeBuy.multiply(holding.getAverageBuyPrice());
            BigDecimal totalQuantityAfterBuy = totalQuantityBeforeBuy.add(filledQuantity);
            BigDecimal updatedAverageBuyPrice = totalBuyAmountBeforeBuy.add(executedAmount)
                    .divide(totalQuantityAfterBuy, 8, RoundingMode.HALF_UP);
            BigDecimal updatedAvailableQuantity = holding.getQuantity().add(filledQuantity);

            holding.updateHolding(updatedAvailableQuantity, updatedAverageBuyPrice);
        }

        // 지정가 매수 체결 이력 저장
        TradeHistory history = TradeHistory.createLimitBuyHistory(
                wallet,
                order,
                order.getSymbol(),
                order.getOrderPrice(),
                filledQuantity,
                executedAmount,
                fee
        );
        tradeHistoryRepository.save(history);

        // 주문 완료 상태 반영
        order.completeOrder(
                filledQuantity,
                order.getOrderPrice(),
                executedAmount,
                fee,
                history.getExecutedAt()
        );
        // 미체결 심볼 상태 동기화
        limitOrderSignalRegistry.syncOpenSymbol(order.getSymbol(), orderRepository.existsOpenLimitOrderBySymbol(order.getSymbol()));
    }

    // 지정가 매도 체결 로직
    private void executeLimitSell(Order order, Assets wallet) {
        // 남은 수량 전체 체결 기준 정산 값 계산
        BigDecimal sellQuantity = order.getRemainingQuantity();
        BigDecimal executedAmount = order.getOrderPrice()
                .multiply(sellQuantity)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal fee = TradeFeePolicy.calculateFee(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);
        BigDecimal settlementAmount = executedAmount.subtract(fee);

        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, order.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("체결 대상 보유 코인을 찾을 수 없습니다."));

        BigDecimal originalCost = sellQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
        BigDecimal realizedProfit = settlementAmount.subtract(originalCost);

        // 예약 수량 소진과 정산 금액 반영
        holding.consumeLockedQuantity(sellQuantity);
        wallet.addMoney(settlementAmount);

        // 지정가 매도 체결 이력 저장
        TradeHistory history = TradeHistory.createLimitSellHistory(
                wallet,
                order,
                order.getSymbol(),
                order.getOrderPrice(),
                sellQuantity,
                executedAmount,
                fee,
                realizedProfit
        );
        tradeHistoryRepository.save(history);

        // 주문 완료 상태 반영
        order.completeOrder(
                sellQuantity,
                order.getOrderPrice(),
                executedAmount,
                fee,
                history.getExecutedAt()
        );
        // 미체결 심볼 상태 동기화
        limitOrderSignalRegistry.syncOpenSymbol(order.getSymbol(), orderRepository.existsOpenLimitOrderBySymbol(order.getSymbol()));
    }
}
