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
// 筌왖?類? 雅뚯눖揆 筌ｋ떯猿?筌ｌ꼶????뺥돩??
public class LimitOrderExecutionService {

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final TradeHistoryRepository tradeHistoryRepository;
    private final LimitOrderSignalRegistry limitOrderSignalRegistry;

    // 筌왖?類? 雅뚯눖揆 筌ｋ떯猿?筌욊쑴??嚥≪뮇彛?
    @Transactional
    public void executeTriggeredOrder(Long orderId) {
        Order order = orderRepository.findByIdForExecution(orderId)
                .orElseThrow(() -> new IllegalArgumentException("筌ｋ떯猿?????雅뚯눖揆??筌≪뼚??????곷뮸??덈뼄."));

        if (!"LIMIT".equals(order.getOrderType())) {
            throw new IllegalArgumentException("筌왖?類? 雅뚯눖揆筌?筌ｋ떯猿???뺥돩??쇱벥 ???怨몄뿯??덈뼄.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            log.info("[筌왖?類? 筌ｋ떯猿???쎄땁] orderId={}, status={}", orderId, order.getStatus());
            return;
        }

        // 筌ｋ떯猿?筌ｌ꼶???筌왖揶????醫됲닊 ?類ｋ궖
        Assets wallet = assetRepository.findByIdForUpdate(order.getAssets().getId())
                .orElseThrow(() -> new IllegalArgumentException("雅뚯눖揆???怨뚭퍙??筌왖揶쏅쵐??筌≪뼚??????곷뮸??덈뼄."));

        if ("BUY".equals(order.getSide())) {
            executeLimitBuy(order, wallet);
            return;
        }

        if ("SELL".equals(order.getSide())) {
            executeLimitSell(order, wallet);
            return;
        }

        throw new IllegalArgumentException("筌왖?癒곕릭筌왖 ??낅뮉 筌띲끇??獄쎻뫚堉??낅빍??");
    }

    // 筌왖?類? 筌띲끉??筌ｋ떯猿?嚥≪뮇彛?
    private void executeLimitBuy(Order order, Assets wallet) {
        // ??? ??롮쎗 ?袁⑷퍥 筌ｋ떯猿?疫꿸퀣? ?類ㅺ텦 揶??④쑴沅?
        BigDecimal filledQuantity = order.getRemainingQuantity();
        BigDecimal executedAmount = order.getOrderPrice()
                .multiply(filledQuantity)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal fee = TradeFeePolicy.calculateFee(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);
        BigDecimal reservedAmount = TradeFeePolicy.calculateReservationAmount(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);

        // 雅뚯눖揆 ????됰튋???癒?닊 + ??뤿땾?????춭
        wallet.consumeLockedMoney(reservedAmount);

        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, order.getSymbol())
                .orElse(null);

        // ?醫됲뇣 癰귣똻? ??밴쉐??疫꿸퀣??癰귣똻? 揶쏄퉮???브쑨由?筌ｌ꼶??
        if (holding == null) {
            holdingRepository.save(
                    Holding.createFirstHolding(wallet, order.getSymbol(), filledQuantity, order.getOrderPrice())
            );
        } else {
            // ?醫됲닊 ??롮쎗 ??釉????뇧 筌띲끉?붷첎? ?????
            BigDecimal totalQuantityBeforeBuy = holding.getQuantity().add(holding.getLockedQuantity());
            BigDecimal totalBuyAmountBeforeBuy = totalQuantityBeforeBuy.multiply(holding.getAverageBuyPrice());
            BigDecimal totalQuantityAfterBuy = totalQuantityBeforeBuy.add(filledQuantity);
            BigDecimal updatedAverageBuyPrice = totalBuyAmountBeforeBuy.add(executedAmount)
                    .divide(totalQuantityAfterBuy, 8, RoundingMode.HALF_UP);
            BigDecimal updatedAvailableQuantity = holding.getQuantity().add(filledQuantity);

            holding.updateHolding(updatedAvailableQuantity, updatedAverageBuyPrice);
        }

        // 筌왖?類? 筌띲끉??筌ｋ떯猿?????????
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

        // 雅뚯눖揆 ?袁⑥┷ ?怨밴묶 獄쏆꼷??
        order.completeOrder(
                filledQuantity,
                order.getOrderPrice(),
                executedAmount,
                fee,
                history.getExecutedAt()
        );
        // 沃섎챷猿쒎칰??????怨밴묶 ??녿┛??
        limitOrderSignalRegistry.syncOpenSymbol(order.getSymbol(), orderRepository.existsOpenLimitOrderBySymbol(order.getSymbol()));
    }

    // 筌왖?類? 筌띲끇猷?筌ｋ떯猿?嚥≪뮇彛?
    private void executeLimitSell(Order order, Assets wallet) {
        // ??? ??롮쎗 ?袁⑷퍥 筌ｋ떯猿?疫꿸퀣? ?類ㅺ텦 揶??④쑴沅?
        BigDecimal sellQuantity = order.getRemainingQuantity();
        BigDecimal executedAmount = order.getOrderPrice()
                .multiply(sellQuantity)
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal fee = TradeFeePolicy.calculateFee(executedAmount, TradeFeePolicy.LIMIT_FEE_RATE);
        BigDecimal settlementAmount = executedAmount.subtract(fee);

        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, order.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("筌ｋ떯猿?????癰귣똻? ?꾨뗄???筌≪뼚??????곷뮸??덈뼄."));

        BigDecimal originalCost = sellQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
        BigDecimal realizedProfit = settlementAmount.subtract(originalCost);

        // ??됰튋 ??롮쎗 ???춭???類ㅺ텦 疫뀀뜆釉?獄쏆꼷??
        holding.consumeLockedQuantity(sellQuantity);
        wallet.addMoney(settlementAmount);

        // 筌왖?類? 筌띲끇猷?筌ｋ떯猿?????????
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

        // 雅뚯눖揆 ?袁⑥┷ ?怨밴묶 獄쏆꼷??
        order.completeOrder(
                sellQuantity,
                order.getOrderPrice(),
                executedAmount,
                fee,
                history.getExecutedAt()
        );
        // 沃섎챷猿쒎칰??????怨밴묶 ??녿┛??
        limitOrderSignalRegistry.syncOpenSymbol(order.getSymbol(), orderRepository.existsOpenLimitOrderBySymbol(order.getSymbol()));
    }
}
