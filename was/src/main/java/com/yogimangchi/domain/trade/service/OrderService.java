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

        validateSide(side);

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

        validateWalletNotExpired(wallet);

        // 매수는 현금을, 매도는 보유 코인을 잠가서 다른 주문에 중복 사용되지 않게 한다.
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

    @Transactional(readOnly = true)
    public CursorResponseDto<OrderResponseDto> getOrders(Long memberId, OrderSearchConditionDto condition) {
        Long assetId = resolveAssetId(memberId, condition.assetType());

        // QueryDSL projection 결과를 그대로 받아 응답 DTO로 변환한다.
        List<OrderQueryDto> orders = orderRepository.searchOrders(memberId, condition, assetId);

        // size + 1 개를 조회해 다음 페이지 존재 여부를 판단한다.
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

    // MOCK는 현재 진행 중인 ACTIVE 지갑 기준으로만 주문을 조회한다
    private Long resolveAssetId(Long memberId, AssetType assetType) {
        if (assetType == AssetType.MOCK) {
            return assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                    .map(Assets::getId)
                    .orElseThrow(() -> new IllegalArgumentException("현재 참여중인 모의투자 계좌가 존재하지 않습니다."));
        }

        return null;
    }

    private void validateSide(String side) {
        if (!"BUY".equals(side) && !"SELL".equals(side)) {
            throw new IllegalArgumentException("지원하지 않는 매매 방향입니다.");
        }
    }

    // 만료된 콘텐츠 지갑은 더 이상 주문을 받을 수 없다.
    private void validateWalletNotExpired(Assets wallet) {
        if (LocalDateTime.now().isAfter(wallet.getExpiredAt())) {
            throw new IllegalArgumentException("해당 콘텐츠의 진행 기간이 만료되어 더 이상 매매할 수 없습니다. 지갑을 다시 생성해주세요.");
        }
    }
}
