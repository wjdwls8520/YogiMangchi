package com.yogimangchi.domain.futures.repository.query;

import com.yogimangchi.domain.futures.dto.query.FuturesOrderQueryDto;
import com.yogimangchi.domain.futures.dto.request.FuturesOrderSearchConditionDto;

import java.util.List;

public interface FuturesOrderRepositoryCustom {

    // 지갑 기준 선물 주문 내역 조회 (체결/미체결 통합, 커서 방식)
    List<FuturesOrderQueryDto> searchOrders(Long assetsId, FuturesOrderSearchConditionDto condition);
}
