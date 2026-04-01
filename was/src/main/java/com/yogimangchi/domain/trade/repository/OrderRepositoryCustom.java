package com.yogimangchi.domain.trade.repository;

import com.yogimangchi.domain.trade.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.query.OrderQueryDto;

import java.util.List;

public interface OrderRepositoryCustom {

    List<OrderQueryDto> searchOrders(Long memberId, OrderSearchConditionDto condition, Long assetId);

    List<OrderQueryDto> searchOpenOrders(Long memberId, OpenOrderSearchConditionDto condition, Long assetId);
}
