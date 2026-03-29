package com.yogimangchi.domain.trade.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.trade.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.response.CursorResponseDto;
import com.yogimangchi.domain.trade.dto.response.OrderResponseDto;
import com.yogimangchi.domain.trade.entity.Order;
import com.yogimangchi.domain.trade.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;
    private final MarketSymbolRepository marketSymbolRepository;

    @Transactional(readOnly = true)
    public CursorResponseDto<OrderResponseDto> getOrders(Long memberId, OrderSearchConditionDto condition) {
        Long assetId = resolveAssetId(memberId, condition.assetType());

        List<Order> orders = orderRepository.searchOrders(memberId, condition, assetId);

        int limitSize = condition.getOrDefaultSize();
        boolean hasNext = orders.size() > limitSize;

        if (hasNext) {
            orders.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!orders.isEmpty()) {
            nextCursorId = orders.get(orders.size() - 1).getId();
        }

        List<OrderResponseDto> content = orders.stream()
                .map(order -> OrderResponseDto.from(order, resolveDisplayNameKr(order.getSymbol())))
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getOpenOrders(Long memberId, OpenOrderSearchConditionDto condition) {
        Long assetId = resolveAssetId(memberId, condition.assetType());

        return orderRepository.searchOpenOrders(memberId, condition, assetId).stream()
                .map(order -> OrderResponseDto.from(order, resolveDisplayNameKr(order.getSymbol())))
                .toList();
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

    // 화면에서 심볼만 보이지 않도록 메뉴판의 한글명을 함께 내려준다
    private String resolveDisplayNameKr(String symbol) {
        return marketSymbolRepository.findById(symbol)
                .map(marketSymbol -> marketSymbol.getDisplayNameKr())
                .orElse(symbol);
    }
}
