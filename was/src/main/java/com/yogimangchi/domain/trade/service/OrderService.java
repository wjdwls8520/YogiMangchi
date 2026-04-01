package com.yogimangchi.domain.trade.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.trade.dto.query.OrderQueryDto;
import com.yogimangchi.domain.trade.dto.request.LimitOrderRequestDto;
import com.yogimangchi.domain.trade.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.response.CursorResponseDto;
import com.yogimangchi.domain.trade.dto.response.OrderResponseDto;
import com.yogimangchi.domain.trade.entity.Order;
import com.yogimangchi.domain.trade.enums.OrderStatus;
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

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final MarketSymbolRepository marketSymbolRepository;

    private static final BigDecimal MIN_ORDER_AMOUNT = new BigDecimal("10");

    // 지정가 주문은 체결 로그를 만들지 않고, PENDING 주문과 잠금 자산만 먼저 만듬
    @Transactional
    public void createLimitOrder(Long memberId, LimitOrderRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();
        String side = request.side().trim().toUpperCase();

        if (!"BUY".equals(side) && !"SELL".equals(side)) {
            throw new IllegalArgumentException("지원하지 않는 매매 방향입니다.");
        }

        MarketSymbol marketSymbol = marketSymbolRepository.findById(symbol)
                .orElseThrow(() -> new IllegalArgumentException("거래를 지원하지 않는 코인입니다."));
        if (!marketSymbol.isActive()) {
            throw new IllegalArgumentException("현재 거래가 임시 중지 되거나 상장 폐지된 코인입니다.");
        }

        BigDecimal orderAmount = request.price().multiply(request.quantity()).setScale(4, RoundingMode.HALF_UP);
        if (orderAmount.compareTo(MIN_ORDER_AMOUNT) < 0) {
            throw new IllegalArgumentException("최소 주문 금액은 " + MIN_ORDER_AMOUNT + " 달러 이상이어야 합니다.");
        }

        Assets wallet = assetRepository.findByMemberIdAndTypeAndStatusForUpdate(memberId, request.assetType(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 " + request.assetType() + " 지갑을 찾을 수 없습니다."));


        // 만료된 콘텐츠 지갑은 더 이상 주문을 받을 수 없음
        if (LocalDateTime.now().isAfter(wallet.getExpiredAt())) {
            throw new IllegalArgumentException("해당 콘텐츠의 진행 기간이 만료되어 더 이상 매매할 수 없습니다. 지갑을 다시 생성해주세요.");
        }

        // 매수는 현금을, 매도는 보유 코인을 잠가서 다른 주문에 중복 사용불가
        if ("BUY".equals(side)) {
            wallet.lockMoney(orderAmount);
        } else {
            Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(wallet, symbol)
                    .orElseThrow(() -> new IllegalArgumentException("해당 코인을 보유하고 있지 않습니다."));
            holding.lockQuantity(request.quantity());
        }

        orderRepository.save(
                Order.createLimitOrder(wallet, symbol, side, request.price(), request.quantity())
        );
    }

    // 주문 취소는 남아 있는 미체결 수량 기준으로 잠금 자산을 되돌림
    @Transactional
    public void cancelOrder(Long memberId, Long orderId) {
        // 취소와 체결이 동시에 들어오지 않게 주문 행을 락
        Order order = orderRepository.findByIdAndMemberIdForUpdate(orderId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("주문을 찾을 수 없습니다."));

        if (!"LIMIT".equals(order.getOrderType())) {
            throw new IllegalArgumentException("지정가 주문만 취소할 수 있습니다.");
        }

        // 1차 구현에서는 미체결/부분 체결만 취소 가능하게 제한
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.PARTIALLY_FILLED) {
            throw new IllegalArgumentException("미체결 또는 부분 체결 상태의 주문만 취소할 수 있습니다.");
        }

        // 남아 있는 미체결 물량만 되돌려야 나중에 부분 체결에도 같은 로직을 재사용
        if ("BUY".equals(order.getSide())) {
            releaseLockedMoney(order);
        } else {
            releaseLockedQuantity(order);
        }

        order.cancelOrder(LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<OrderResponseDto> getOrders(Long memberId, OrderSearchConditionDto condition) {
        Long assetId = resolveAssetId(memberId, condition.assetType());

        // QueryDSL projection 결과를 그대로 받아 응답 DTO로 변환함
        List<OrderQueryDto> orders = orderRepository.searchOrders(memberId, condition, assetId);

        // size + 1 개를 조회해 다음 페이지 존재 여부를 판단
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

        // 미체결 주문도 주문내역과 같은 커서 패턴으로 응답
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

    // MOCK는 현재 진행 중인 ACTIVE 지갑 기준으로만 주문을 조회
    private Long resolveAssetId(Long memberId, AssetType assetType) {
        if (assetType == AssetType.MOCK) {
            return assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                    .map(Assets::getId)
                    .orElseThrow(() -> new IllegalArgumentException("현재 참여중인 모의투자 계좌가 존재하지 않습니다."));
        }

        return null;
    }


    private void releaseLockedMoney(Order order) {
        if (order.getOrderPrice() == null) {
            throw new IllegalArgumentException("지정가 주문 가격 정보가 없습니다.");
        }

        // 매수 취소는 아직 체결되지 않은 남은 수량만큼의 예약 현금을 되돌림
        BigDecimal releaseMoney = order.getOrderPrice()
                .multiply(order.getRemainingQuantity())
                .setScale(4, RoundingMode.HALF_UP);

        Assets wallet = assetRepository.findByIdForUpdate(order.getAssets().getId())
                .orElseThrow(() -> new IllegalArgumentException("주문에 연결된 지갑을 찾을 수 없습니다."));

        wallet.unlockMoney(releaseMoney);
    }

    private void releaseLockedQuantity(Order order) {
        // 매도 취소는 남아 있는 미체결 수량만큼의 잠긴 코인을 다시 가용 수량으로 돌림
        Holding holding = holdingRepository.findByAssetsAndSymbolForUpdate(order.getAssets(), order.getSymbol())
                .orElseThrow(() -> new IllegalArgumentException("주문에 연결된 보유 코인을 찾을 수 없습니다."));

        holding.unlockQuantity(order.getRemainingQuantity());
    }


}
