package com.yogimangchi.domain.spot.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.spot.constant.TradeFeePolicy;
import com.yogimangchi.domain.spot.entity.Order;
import com.yogimangchi.domain.spot.entity.TradeHistory;
import com.yogimangchi.domain.spot.enums.OrderStatus;
import com.yogimangchi.domain.spot.matching.LimitOrderSignalRegistry;
import com.yogimangchi.domain.spot.repository.OrderRepository;
import com.yogimangchi.domain.spot.repository.TradeHistoryRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
// 지정가 주문 체결을 처리하는 서비스
public class LimitOrderExecutionService {

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final TradeHistoryRepository tradeHistoryRepository;
    private final LimitOrderSignalRegistry limitOrderSignalRegistry;

    // 지정가 주문 체결 실행
    @Transactional
    public void executeTriggeredOrder(Long orderId) {
        Order order = orderRepository.findByIdForExecution(orderId)
                .orElseThrow(() -> new IllegalArgumentException("체결할 주문을 찾을 수 없습니다."));

        if (!"LIMIT".equals(order.getOrderType())) {
            throw new IllegalArgumentException("지정가 주문만 체결할 수 있습니다.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            log.info("[지정가 주문 체결 스킵] orderId={}, status={}", orderId, order.getStatus());
            return;
        }

        // 주문에 연결된 지갑을 조회하고 잠근다.
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

        throw new IllegalArgumentException("지원하지 않는 주문 방향입니다.");
    }

    // 지정가 매수 주문 체결
    private void executeLimitBuy(Order order, Assets wallet) {
        // 남은 수량 전체를 이번 체결 수량으로 사용한다.
        BigDecimal filledQuantity = order.getRemainingQuantity();
        BigDecimal executedAmount = order.getOrderPrice()
                .multiply(filledQuantity)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal fee = TradeFeePolicy.calculateFee(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);
        BigDecimal reservedAmount = TradeFeePolicy.calculateReservationAmount(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);

        // 예약된 금액에서 체결 금액과 수수료를 함께 차감한다.
        wallet.consumeLockedMoney(reservedAmount);

        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, order.getSymbol())
                .orElse(null);

        // 보유 코인이 없으면 신규 보유 정보를 만들고, 있으면 평균 매수가를 갱신한다.
        if (holding == null) {
            holdingRepository.save(
                    Holding.createFirstHolding(wallet, order.getSymbol(), filledQuantity, order.getOrderPrice())
            );
        } else {
            BigDecimal totalQuantityBeforeBuy = holding.getQuantity().add(holding.getLockedQuantity());
            BigDecimal totalBuyAmountBeforeBuy = totalQuantityBeforeBuy.multiply(holding.getAverageBuyPrice());
            BigDecimal totalQuantityAfterBuy = totalQuantityBeforeBuy.add(filledQuantity);
            BigDecimal updatedAverageBuyPrice = totalBuyAmountBeforeBuy.add(executedAmount)
                    .divide(totalQuantityAfterBuy, 8, RoundingMode.HALF_UP);
            BigDecimal updatedAvailableQuantity = holding.getQuantity().add(filledQuantity);

            holding.updateHolding(updatedAvailableQuantity, updatedAverageBuyPrice);
        }

        // 지정가 매수 체결 이력을 저장한다.
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

        // 주문 상태를 전량 체결로 변경한다.
        order.completeOrder(
                filledQuantity,
                order.getOrderPrice(),
                executedAmount,
                fee,
                history.getExecutedAt()
        );

        // 미체결 심볼 상태를 갱신한다.
        limitOrderSignalRegistry.syncOpenSymbol(order.getSymbol(), orderRepository.existsOpenLimitOrderBySymbol(order.getSymbol()));
    }

    // 지정가 매도 주문 체결
    private void executeLimitSell(Order order, Assets wallet) {
        // 남은 수량 전체를 이번 체결 수량으로 사용한다.
        BigDecimal sellQuantity = order.getRemainingQuantity();
        BigDecimal executedAmount = order.getOrderPrice()
                .multiply(sellQuantity)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal fee = TradeFeePolicy.calculateFee(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);
        BigDecimal settlementAmount = executedAmount.subtract(fee);

        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, order.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("체결할 보유 코인을 찾을 수 없습니다."));

        BigDecimal originalCost = sellQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
        BigDecimal realizedProfit = settlementAmount.subtract(originalCost);

        // 잠금 수량을 차감하고 수수료 반영 정산 금액을 지갑에 반영한다.
        holding.consumeLockedQuantity(sellQuantity);
        wallet.addMoney(settlementAmount);

        // 지정가 매도 체결 이력을 저장한다.
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

        // 주문 상태를 전량 체결로 변경한다.
        order.completeOrder(
                sellQuantity,
                order.getOrderPrice(),
                executedAmount,
                fee,
                history.getExecutedAt()
        );

        // 미체결 심볼 상태를 갱신한다.
        limitOrderSignalRegistry.syncOpenSymbol(order.getSymbol(), orderRepository.existsOpenLimitOrderBySymbol(order.getSymbol()));
    }
}
