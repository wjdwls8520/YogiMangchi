package com.yogimangchi.domain.trade.repository;

import com.yogimangchi.domain.trade.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.trade.entity.Order;

import java.util.List;

public interface OrderRepositoryCustom {

    List<Order> searchOrders(Long memberId, OrderSearchConditionDto condition, Long assetId);

    List<Order> searchOpenOrders(Long memberId, OpenOrderSearchConditionDto condition, Long assetId);
}
