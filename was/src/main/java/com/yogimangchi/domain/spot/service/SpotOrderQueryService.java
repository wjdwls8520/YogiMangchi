package com.yogimangchi.domain.spot.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.spot.dto.query.OrderQueryDto;
import com.yogimangchi.domain.spot.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.spot.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import com.yogimangchi.domain.spot.dto.response.OrderResponseDto;
import com.yogimangchi.domain.spot.repository.OrderRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SpotOrderQueryService {

    private final OrderRepository orderRepository;
    private final AssetRepository assetRepository;

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
                    .orElseThrow(() -> new IllegalArgumentException("현재 참여 중인 모의투자 계좌가 존재하지 않습니다."));
        }

        return null;
    }
}
