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
    private final LimitOrderSignalRegistry limitOrderSignalRegistry;

    // 지정가 주문 접수 로직
    @Transactional
    public void createLimitOrder(Long memberId, LimitOrderRequestDto request) {
        // 요청 심볼과 방향 정규화
        String symbol = request.symbol().trim().toUpperCase();
        String side = request.side().trim().toUpperCase();

        if (!"BUY".equals(side) && !"SELL".equals(side)) {
            throw new IllegalArgumentException("지원하지 않는 매매 방향입니다.");
        }

        // 주문 가능 심볼과 상장 상태 검증
        MarketSymbol marketSymbol = marketSymbolRepository.findById(symbol)
                .orElseThrow(() -> new IllegalArgumentException("거래를 지원하지 않는 코인입니다."));
        if (!marketSymbol.isActive()) {
            throw new IllegalArgumentException("현재 거래가 일시 중지되었거나 상장 폐지된 코인입니다.");
        }

        // 최소 주문 금액 검증
        BigDecimal orderAmount = request.price().multiply(request.quantity()).setScale(4, RoundingMode.HALF_UP);
        if (orderAmount.compareTo(MIN_ORDER_AMOUNT) < 0) {
            throw new IllegalArgumentException("최소 주문 금액은 " + MIN_ORDER_AMOUNT + " 달러 이상이어야 합니다.");
        }

        // 활성 지갑 행 잠금 확보
        Assets wallet = assetRepository.findByMemberIdAndTypeAndStatusForUpdate(memberId, request.assetType(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 " + request.assetType() + " 지갑을 찾을 수 없습니다."));

        if (LocalDateTime.now().isAfter(wallet.getExpiredAt())) {
            throw new IllegalArgumentException("해당 콘텐츠의 진행 기간이 만료되어 더 이상 매매할 수 없습니다. 지갑을 다시 생성해주세요.");
        }

        // 매수는 원금 + 수수료 예약, 매도는 수량 예약
        if ("BUY".equals(side)) {
            wallet.lockMoney(TradeFeePolicy.calculateReservationAmount(orderAmount, TradeFeePolicy.LIMIT_FEE_RATE));
        } else {
            Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, symbol)
                    .orElseThrow(() -> new IllegalArgumentException("해당 코인을 보유하고 있지 않습니다."));
            holding.lockQuantity(request.quantity());
        }

        // 미체결 심볼 감시 대상 등록
        orderRepository.save(Order.createLimitOrder(wallet, symbol, side, request.price(), request.quantity()));
        limitOrderSignalRegistry.registerOpenSymbol(symbol);
    }

    // 주문 취소 로직
    @Transactional
    public void cancelOrder(Long memberId, Long orderId) {
        Order order = orderRepository.findByIdAndMemberIdForUpdate(orderId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (!"LIMIT".equals(order.getOrderType())) {
            throw new IllegalArgumentException("지정가 주문만 취소할 수 있습니다.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            throw new IllegalArgumentException("미체결 또는 부분체결 상태의 주문만 취소할 수 있습니다.");
        }

        // 남은 예약 자산 복구 분기 처리
        if ("BUY".equals(order.getSide())) {
            releaseLockedMoney(order);
        } else {
            releaseLockedQuantity(order);
        }

        order.cancelOrder(LocalDateTime.now());
        // 취소 후 미체결 심볼 상태 동기화
        limitOrderSignalRegistry.syncOpenSymbol(order.getSymbol(), orderRepository.existsOpenLimitOrderBySymbol(order.getSymbol()));
    }

    // 주문 내역 조회 로직
    @Transactional(readOnly = true)
    public CursorResponseDto<OrderResponseDto> getOrders(Long memberId, OrderSearchConditionDto condition) {
        Long assetId = resolveAssetId(memberId, condition.assetType());
        List<OrderQueryDto> orders = orderRepository.searchOrders(memberId, condition, assetId);

        int limitSize = condition.getOrDefaultSize();
        boolean hasNext = orders.size() > limitSize;

        // 커서 페이징용 초과 조회 결과 정리
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

    // 미체결 주문 조회 로직
    @Transactional(readOnly = true)
    public CursorResponseDto<OrderResponseDto> getOpenOrders(Long memberId, OpenOrderSearchConditionDto condition) {
        Long assetId = resolveAssetId(memberId, condition.assetType());
        List<OrderQueryDto> orders = orderRepository.searchOpenOrders(memberId, condition, assetId);

        int limitSize = condition.getOrDefaultSize();
        boolean hasNext = orders.size() > limitSize;

        // 커서 페이징용 초과 조회 결과 정리
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

    // MOCK 자산 전용 활성 지갑 식별 로직
    private Long resolveAssetId(Long memberId, AssetType assetType) {
        if (assetType == AssetType.MOCK) {
            return assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                    .map(Assets::getId)
                    .orElseThrow(() -> new IllegalArgumentException("현재 참여중인 모의투자 계좌가 존재하지 않습니다."));
        }

        return null;
    }

    // 지정가 매수 잠금 현금 복구 로직
    private void releaseLockedMoney(Order order) {
        if (order.getOrderPrice() == null) {
            throw new IllegalArgumentException("지정가 주문 가격 정보가 없습니다.");
        }

        // 미체결 잔량 기준 예약 원금 + 수수료 재계산
        BigDecimal remainingAmount = order.getOrderPrice()
                .multiply(order.getRemainingQuantity())
                .setScale(4, RoundingMode.HALF_UP);
        BigDecimal releaseMoney = TradeFeePolicy.calculateReservationAmount(remainingAmount, TradeFeePolicy.LIMIT_FEE_RATE);

        Assets wallet = assetRepository.findByIdForUpdate(order.getAssets().getId())
                .orElseThrow(() -> new IllegalArgumentException("주문에 연결된 지갑을 찾을 수 없습니다."));

        // 취소 대상 예약 금액 복구
        wallet.unlockMoney(releaseMoney);
    }

    // 지정가 매도 잠금 수량 복구 로직
    private void releaseLockedQuantity(Order order) {
        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(order.getAssets(), order.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("주문에 연결된 보유 코인을 찾을 수 없습니다."));

        // 취소 대상 예약 수량 복구
        holding.unlockQuantity(order.getRemainingQuantity());
    }
}
