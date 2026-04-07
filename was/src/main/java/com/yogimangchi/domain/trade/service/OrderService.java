package com.yogimangchi.domain.trade.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.trade.constant.TradeFeePolicy;
import com.yogimangchi.domain.trade.dto.query.OrderQueryDto;
import com.yogimangchi.domain.trade.dto.request.LimitOrderRequestDto;
import com.yogimangchi.domain.trade.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.response.CursorResponseDto;
import com.yogimangchi.domain.trade.dto.response.OrderResponseDto;
import com.yogimangchi.domain.trade.entity.Order;
import com.yogimangchi.domain.trade.enums.OrderStatus;
import com.yogimangchi.domain.trade.matching.LimitOrderScheduler;
import com.yogimangchi.domain.trade.matching.LimitOrderSignalRegistry;
import com.yogimangchi.domain.trade.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final BigDecimal MIN_ORDER_AMOUNT = new BigDecimal("10");

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final MarketSymbolRepository marketSymbolRepository;
    private final LimitOrderScheduler limitOrderScheduler;
    private final LimitOrderSignalRegistry limitOrderSignalRegistry;

    @Transactional
    public void createLimitOrder(Long memberId, LimitOrderRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();
        String side = request.side().trim().toUpperCase();

        if (!"BUY".equals(side) && !"SELL".equals(side)) {
            throw new IllegalArgumentException("吏?먰븯吏 ?딅뒗 留ㅻℓ 諛⑺뼢?낅땲??");
        }

        MarketSymbol marketSymbol = marketSymbolRepository.findById(symbol)
                .orElseThrow(() -> new IllegalArgumentException("嫄곕옒瑜?吏?먰븯吏 ?딅뒗 肄붿씤?낅땲??"));
        if (!marketSymbol.isActive()) {
            throw new IllegalArgumentException("?꾩옱 嫄곕옒媛 ?쇱떆 以묒??섏뿀嫄곕굹 ?곸옣 ?먯???肄붿씤?낅땲??");
        }

        BigDecimal orderAmount = request.price().multiply(request.quantity()).setScale(4, RoundingMode.HALF_UP);
        if (orderAmount.compareTo(MIN_ORDER_AMOUNT) < 0) {
            throw new IllegalArgumentException("理쒖냼 二쇰Ц 湲덉븸? " + MIN_ORDER_AMOUNT + " ?댁뼱???⑸땲??");
        }

        Assets wallet = assetRepository.findByMemberIdAndTypeAndStatusForUpdate(memberId, request.assetType(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("?쒖꽦?붾맂 " + request.assetType() + " 吏媛묒쓣 李얠쓣 ???놁뒿?덈떎."));

        if (LocalDateTime.now().isAfter(wallet.getExpiredAt())) {
            throw new IllegalArgumentException("?대떦 肄섑뀗痢좎쓽 吏꾪뻾 湲곌컙??留뚮즺?섏뼱 ???댁긽 留ㅻℓ?????놁뒿?덈떎. 吏媛묒쓣 ?ㅼ떆 ?앹꽦?댁＜?몄슂.");
        }

        if ("BUY".equals(side)) {
            wallet.lockMoney(TradeFeePolicy.calculateReservationAmount(orderAmount, TradeFeePolicy.LIMIT_FEE_RATE));
        } else {
            Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, symbol)
                    .orElseThrow(() -> new IllegalArgumentException("?대떦 肄붿씤??蹂댁쑀?섍퀬 ?덉? ?딆뒿?덈떎."));
            holding.lockQuantity(request.quantity());
        }

        orderRepository.save(Order.createLimitOrder(wallet, symbol, side, request.price(), request.quantity()));
        limitOrderSignalRegistry.registerOpenSymbol(symbol);
        limitOrderScheduler.refreshSchedule();
    }

    @Transactional
    public void cancelOrder(Long memberId, Long orderId) {
        Order order = orderRepository.findByIdAndMemberIdForUpdate(orderId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("二쇰Ц??李얠쓣 ???놁뒿?덈떎."));

        if (!"LIMIT".equals(order.getOrderType())) {
            throw new IllegalArgumentException("吏?뺢? 二쇰Ц留?痍⑥냼?????덉뒿?덈떎.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            throw new IllegalArgumentException("誘몄껜寃??먮뒗 遺遺꾩껜寃??곹깭??二쇰Ц留?痍⑥냼?????덉뒿?덈떎.");
        }

        if ("BUY".equals(order.getSide())) {
            releaseLockedMoney(order);
        } else {
            releaseLockedQuantity(order);
        }

        order.cancelOrder(LocalDateTime.now());
        limitOrderSignalRegistry.syncOpenSymbol(order.getSymbol(), orderRepository.existsOpenLimitOrderBySymbol(order.getSymbol()));
        limitOrderScheduler.refreshSchedule();
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<OrderResponseDto> getOrders(Long memberId, OrderSearchConditionDto condition) {
        Long assetId = resolveAssetId(memberId, condition.assetType());
        List<OrderQueryDto> orders = orderRepository.searchOrders(memberId, condition, assetId);

        int limitSize = condition.getOrDefaultSize();
        boolean hasNext = orders.size() > limitSize;

        if (hasNext) {
            orders.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!orders.isEmpty()) {
            nextCursorId = orders.get(orders.size() - 1).orderId();
        }

        List<OrderResponseDto> content = orders.stream()
                .map(OrderResponseDto::from)
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<OrderResponseDto> getOpenOrders(Long memberId, OpenOrderSearchConditionDto condition) {
        Long assetId = resolveAssetId(memberId, condition.assetType());
        List<OrderQueryDto> orders = orderRepository.searchOpenOrders(memberId, condition, assetId);

        int limitSize = condition.getOrDefaultSize();
        boolean hasNext = orders.size() > limitSize;

        if (hasNext) {
            orders.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!orders.isEmpty()) {
            nextCursorId = orders.get(orders.size() - 1).orderId();
        }

        List<OrderResponseDto> content = orders.stream()
                .map(OrderResponseDto::from)
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    private Long resolveAssetId(Long memberId, AssetType assetType) {
        if (assetType == AssetType.MOCK) {
            return assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                    .map(Assets::getId)
                    .orElseThrow(() -> new IllegalArgumentException("?꾩옱 李몄뿬以묒씤 紐⑥쓽?ъ옄 怨꾩쥖媛 議댁옱?섏? ?딆뒿?덈떎."));
        }

        return null;
    }

    private void releaseLockedMoney(Order order) {
        if (order.getOrderPrice() == null) {
            throw new IllegalArgumentException("吏?뺢? 二쇰Ц 媛寃??뺣낫媛 ?놁뒿?덈떎.");
        }

        BigDecimal remainingAmount = order.getOrderPrice()
                .multiply(order.getRemainingQuantity())
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal releaseMoney = TradeFeePolicy.calculateReservationAmount(remainingAmount, TradeFeePolicy.LIMIT_FEE_RATE);

        Assets wallet = assetRepository.findByIdForUpdate(order.getAssets().getId())
                .orElseThrow(() -> new IllegalArgumentException("二쇰Ц???곌껐??吏媛묒쓣 李얠쓣 ???놁뒿?덈떎."));

        wallet.unlockMoney(releaseMoney);
    }

    private void releaseLockedQuantity(Order order) {
        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(order.getAssets(), order.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("二쇰Ц???곌껐??蹂댁쑀 肄붿씤??李얠쓣 ???놁뒿?덈떎."));

        holding.unlockQuantity(order.getRemainingQuantity());
    }
}
