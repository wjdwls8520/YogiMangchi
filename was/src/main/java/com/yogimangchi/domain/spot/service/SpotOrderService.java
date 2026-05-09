package com.yogimangchi.domain.spot.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.spot.constant.TradeFeePolicy;
import com.yogimangchi.domain.spot.dto.request.LimitOrderRequestDto;
import com.yogimangchi.domain.spot.dto.request.MarketOrderRequestDto;
import com.yogimangchi.domain.spot.entity.Order;
import com.yogimangchi.domain.spot.entity.TradeHistory;
import com.yogimangchi.domain.spot.enums.OrderStatus;
import com.yogimangchi.domain.spot.event.SpotLimitOrderCountEvent;
import com.yogimangchi.domain.spot.event.SpotOrderExecutedEvent;
import com.yogimangchi.domain.spot.matching.LimitOrderScheduler;
import com.yogimangchi.domain.spot.matching.LimitOrderSignalRegistry;
import com.yogimangchi.domain.spot.repository.OrderRepository;
import com.yogimangchi.domain.spot.repository.TradeHistoryRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpotOrderService {

    private static final BigDecimal MIN_ORDER_AMOUNT = new BigDecimal("10");

    private final ChartPriceRepository chartPriceRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final OrderRepository orderRepository;
    private final TradeHistoryRepository tradeHistoryRepository;
    private final MarketSymbolRepository marketSymbolRepository;
    private final NotificationService notificationService;
    private final LimitOrderScheduler limitOrderScheduler;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void createMarketOrder(Long memberId, AssetType assetType, MarketOrderRequestDto request) {
        if ("BUY".equalsIgnoreCase(request.side()) && request.totalAmount() == null) {
            throw new IllegalArgumentException("매수 시 주문 금액은 필수입니다.");
        }
        if ("SELL".equalsIgnoreCase(request.side()) && request.quantity() == null) {
            throw new IllegalArgumentException("매도 시 주문 수량은 필수입니다.");
        }

        // 거래 가능한 코인인지 검증
        MarketSymbol marketSymbol = marketSymbolRepository.findById(request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("거래를 지원하지 않는 코인입니다."));
        if (!marketSymbol.isActive()) {
            throw new IllegalArgumentException("현재 거래가 일시 중지되었거나 상장 폐지된 코인입니다.");
        }

        // 현재 시세 조회
        ChartPriceDto currentPriceDto = chartPriceRepository.findBySymbol(request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("현재 해당 코인의 시세를 확인할 수 없습니다."));
        BigDecimal currentPrice = new BigDecimal(currentPriceDto.price());

        if ("BUY".equalsIgnoreCase(request.side())) {
            if (request.totalAmount().compareTo(MIN_ORDER_AMOUNT) < 0) {
                throw new IllegalArgumentException("최소 주문 금액은 " + MIN_ORDER_AMOUNT + " 달러 이상이어야 합니다.");
            }
        } else if ("SELL".equalsIgnoreCase(request.side())) {
            BigDecimal sellValue = request.quantity().multiply(currentPrice);
            if (sellValue.compareTo(MIN_ORDER_AMOUNT) < 0) {
                throw new IllegalArgumentException("매도하는 코인의 총 가치가 " + MIN_ORDER_AMOUNT + " 달러 이상이어야 합니다.");
            }
        }

        // 주문 지갑 조회 및 락
        Assets wallet = assetRepository.findByMemberIdAndTypeAndStatusForUpdate(memberId, assetType, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 " + assetType + " 지갑을 찾을 수 없습니다."));

        if (LocalDateTime.now().isAfter(wallet.getExpiredAt())) {
            throw new IllegalArgumentException("해당 컨텐츠의 진행 기간이 만료되어 더 이상 매매할 수 없습니다. 지갑을 다시 생성해주세요.");
        }

        if ("BUY".equalsIgnoreCase(request.side())) {
            processMarketBuy(wallet, request, currentPrice);
        } else if ("SELL".equalsIgnoreCase(request.side())) {
            processMarketSell(wallet, request, currentPrice);
        } else {
            throw new IllegalArgumentException("지원하지 않는 매매 방향입니다.");
        }
    }

    @Transactional
    public void createLimitOrder(Long memberId, AssetType assetType, LimitOrderRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();
        String side = request.side().trim().toUpperCase();

        if (!"BUY".equals(side) && !"SELL".equals(side)) {
            throw new IllegalArgumentException("지원하지 않는 매매 방향입니다.");
        }

        MarketSymbol marketSymbol = marketSymbolRepository.findById(symbol)
                .orElseThrow(() -> new IllegalArgumentException("거래를 지원하지 않는 코인입니다."));
        if (!marketSymbol.isActive()) {
            throw new IllegalArgumentException("현재 거래가 일시 중지되었거나 상장 폐지된 코인입니다.");
        }

        BigDecimal orderAmount = request.price().multiply(request.quantity()).setScale(4, RoundingMode.HALF_UP);
        if (orderAmount.compareTo(MIN_ORDER_AMOUNT) < 0) {
            throw new IllegalArgumentException("최소 주문 금액은 " + MIN_ORDER_AMOUNT + " 달러 이상이어야 합니다.");
        }

        Assets wallet = assetRepository.findByMemberIdAndTypeAndStatusForUpdate(memberId, assetType, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 " + assetType + " 지갑을 찾을 수 없습니다."));

        if (LocalDateTime.now().isAfter(wallet.getExpiredAt())) {
            throw new IllegalArgumentException("해당 컨텐츠의 진행 기간이 만료되어 더 이상 매매할 수 없습니다. 지갑을 다시 생성해주세요.");
        }

        if ("BUY".equals(side)) {
            wallet.lockMoney(TradeFeePolicy.calculateReservationAmount(orderAmount, TradeFeePolicy.LIMIT_FEE_RATE));
        } else {
            Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, symbol)
                    .orElseThrow(() -> new IllegalArgumentException("해당 코인을 보유하고 있지 않습니다."));
            holding.lockQuantity(request.quantity());
        }

        orderRepository.save(Order.createLimitOrder(wallet, symbol, side, request.price(), request.quantity()));
        eventPublisher.publishEvent(new SpotLimitOrderCountEvent(symbol, true));
        limitOrderScheduler.refreshSchedule();
    }

    @Transactional
    public void cancelOrder(Long memberId, AssetType assetType, Long orderId) {
        Order order = orderRepository.findByIdAndMemberIdAndAssetTypeForUpdate(orderId, memberId, assetType)
                .orElseThrow(() -> new IllegalArgumentException("해당 지갑 타입에 존재하지 않는 주문이거나 취소 권한이 없습니다."));

        if (!"LIMIT".equals(order.getOrderType())) {
            throw new IllegalArgumentException("지정가 주문만 취소할 수 있습니다.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            throw new IllegalArgumentException("미체결 또는 부분 체결 상태의 주문만 취소할 수 있습니다.");
        }

        if ("BUY".equals(order.getSide())) {
            releaseLockedMoney(order);
        } else {
            releaseLockedQuantity(order);
        }

        order.cancelOrder(LocalDateTime.now());
        eventPublisher.publishEvent(new SpotLimitOrderCountEvent(order.getSymbol(), false));
        limitOrderScheduler.refreshSchedule();
    }

    @Transactional
    public void cancelOpenLimitOrdersByAsset(Assets wallet) {
        List<Order> openOrders = orderRepository.findOpenLimitOrdersByAssetIdForUpdate(
                wallet.getId(),
                List.of(OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED)
        );

        if (openOrders.isEmpty()) {
            return;
        }

        LocalDateTime canceledAt = LocalDateTime.now();

        for (Order order : openOrders) {
            if ("BUY".equals(order.getSide())) {
                releaseLockedMoney(order);
            } else {
                releaseLockedQuantity(order);
            }

            order.cancelOrder(canceledAt);
            // 각 주문 취소 시마다 카운트 감소 이벤트 발행
            eventPublisher.publishEvent(new SpotLimitOrderCountEvent(order.getSymbol(), false));
        }

        limitOrderScheduler.refreshSchedule();
    }

    private void processMarketBuy(Assets wallet, MarketOrderRequestDto request, BigDecimal currentPrice) {
        BigDecimal orderAmount = request.totalAmount(); // 사용자가 입력한 총 지출 금액(수수료 포함)

        // 체결 전 주문 원장을 먼저 생성한다.
        Order order = orderRepository.save(Order.createMarketBuyOrder(wallet, request.symbol(), orderAmount));

        // 총 지출 금액에서 수수료를 분리해 실제 체결 원금을 계산한다.
        BigDecimal fee = TradeFeePolicy.calculateFee(orderAmount, TradeFeePolicy.MARKET_FEE_RATE);
        BigDecimal executedAmount = orderAmount.subtract(fee);

        // 체결 수량은 수수료를 제외한 실제 체결 원금 기준이다.
        BigDecimal quantityToBuy = executedAmount.divide(currentPrice, 8, RoundingMode.HALF_UP);

        // 지갑에서는 실제 정산 금액만큼 차감한다.
        wallet.subtractMoney(orderAmount);

        Holding holding = holdingRepository.findByAssetsAndSymbol(wallet, request.symbol())
                .orElse(null);

        if (holding == null) {
            // 처음 사는 코인이면 새로 생성한다.
            BigDecimal averageBuyPrice = executedAmount.divide(quantityToBuy, 8, RoundingMode.HALF_UP);
            Holding newHolding = Holding.createFirstHolding(wallet, request.symbol(), quantityToBuy, averageBuyPrice);
            holdingRepository.save(newHolding);
        } else {
            // 기존 보유 코인이 있으면 평균 매수가를 물타기 방식으로 갱신한다.
            BigDecimal totalOldValue = holding.getQuantity().multiply(holding.getAverageBuyPrice());
            BigDecimal totalNewValue = executedAmount;
            BigDecimal updatedQuantity = holding.getQuantity().add(quantityToBuy);
            BigDecimal updatedAvgPrice = totalOldValue.add(totalNewValue)
                    .divide(updatedQuantity, 4, RoundingMode.HALF_UP);

            holding.updateHolding(updatedQuantity, updatedAvgPrice);
        }

        // 체결 이력을 저장한다.
        TradeHistory history = TradeHistory.createMarketBuyHistory(
                wallet,
                order,
                request.symbol(),
                currentPrice,
                quantityToBuy,
                executedAmount,
                fee
        );
        tradeHistoryRepository.save(history);

        order.completeOrder(
                quantityToBuy,
                currentPrice,
                executedAmount,
                fee,
                history.getExecutedAt()
        );

        notificationService.notifyOrderCompleted(wallet.getMember(), wallet.getType(), order);

        log.info("[매수 완료] 유저: {}, 코인: {}, 총지출: {}, 체결원금: {}, 수수료: {}, 체결수량: {}",
                wallet.getMember().getId(), request.symbol(), orderAmount, executedAmount, fee, quantityToBuy);

        // [이벤트 발행 최적화] 모의투자(MOCK) 체결일 때만 퀘스트 달성 이벤트를 발행하여 불필요한 이벤트 생성을 차단합니다.
        if (wallet.getType() == AssetType.MOCK) {
            eventPublisher.publishEvent(new SpotOrderExecutedEvent(wallet.getMember().getId(), wallet.getType()));
        }
    }

    private void processMarketSell(Assets wallet, MarketOrderRequestDto request, BigDecimal currentPrice) {
        BigDecimal sellQuantity = request.quantity();

        // 체결 전 주문 원장을 먼저 생성한다.
        Order order = orderRepository.save(Order.createMarketSellOrder(wallet, request.symbol(), sellQuantity));

        Holding holding = holdingRepository.findByAssetsAndSymbol(wallet, request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("해당 코인을 보유하고 있지 않습니다."));

        if (holding.getQuantity().compareTo(sellQuantity) < 0) {
            throw new IllegalArgumentException("보유 수량이 부족합니다.");
        }

        // 매도 체결 금액은 수수료 차감 전 기준이다.
        BigDecimal executedAmount = sellQuantity.multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);

        // 수수료와 실제 정산 금액을 계산한다.
        BigDecimal fee = TradeFeePolicy.calculateFee(executedAmount, TradeFeePolicy.MARKET_FEE_RATE);
        BigDecimal settlementAmount = executedAmount.subtract(fee);

        // 실현 손익을 계산한다.
        BigDecimal originalCost = sellQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
        BigDecimal realizedProfit = settlementAmount.subtract(originalCost);

        wallet.addMoney(settlementAmount);

        BigDecimal remainQuantity = holding.getQuantity().subtract(sellQuantity);
        holding.updateHolding(remainQuantity, holding.getAverageBuyPrice());

        // 체결 이력을 저장한다.
        TradeHistory history = TradeHistory.createMarketSellHistory(
                wallet,
                order,
                request.symbol(),
                currentPrice,
                sellQuantity,
                executedAmount,
                fee,
                realizedProfit
        );
        tradeHistoryRepository.save(history);

        order.completeOrder(
                sellQuantity,
                currentPrice,
                executedAmount,
                fee,
                history.getExecutedAt()
        );

        notificationService.notifyOrderCompleted(wallet.getMember(), wallet.getType(), order);

        log.info("[매도 완료] 유저: {}, 코인: {}, 수량: {}, 체결원금: {}, 수수료: {}, 실수령액: {}",
                wallet.getMember().getId(), request.symbol(), sellQuantity, executedAmount, fee, settlementAmount);

        // [이벤트 발행 최적화] 모의투자(MOCK) 체결일 때만 퀘스트 달성 이벤트를 발행하여 불필요한 이벤트 생성을 차단합니다.
        if (wallet.getType() == AssetType.MOCK) {
            eventPublisher.publishEvent(new SpotOrderExecutedEvent(wallet.getMember().getId(), wallet.getType()));
        }
    }

    private void releaseLockedMoney(Order order) {
        if (order.getOrderPrice() == null) {
            throw new IllegalArgumentException("지정가 주문 가격 정보가 없습니다.");
        }

        BigDecimal remainingAmount = order.getOrderPrice()
                .multiply(order.getRemainingQuantity())
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal releaseMoney = TradeFeePolicy.calculateReservationAmount(remainingAmount, TradeFeePolicy.LIMIT_FEE_RATE);

        Assets wallet = assetRepository.findByIdForUpdate(order.getAssets().getId())
                .orElseThrow(() -> new IllegalArgumentException("주문에 연결된 지갑을 찾을 수 없습니다."));

        wallet.unlockMoney(releaseMoney);
    }

    private void releaseLockedQuantity(Order order) {
        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(order.getAssets(), order.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("주문에 연결된 보유 코인을 찾을 수 없습니다."));

        holding.unlockQuantity(order.getRemainingQuantity());
    }
}
