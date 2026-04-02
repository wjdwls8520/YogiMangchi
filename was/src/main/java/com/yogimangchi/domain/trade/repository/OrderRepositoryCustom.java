package com.yogimangchi.domain.trade.repository;

import com.yogimangchi.domain.trade.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.query.OrderQueryDto;

import java.math.BigDecimal;
import java.util.List;

public interface OrderRepositoryCustom {

    // 주문 내역 목록 조회 메서드
    List<OrderQueryDto> searchOrders(Long memberId, OrderSearchConditionDto condition, Long assetId);

    // 미체결 주문 목록 조회 메서드
    List<OrderQueryDto> searchOpenOrders(Long memberId, OpenOrderSearchConditionDto condition, Long assetId);

    // 지정가 매수 체결 후보 ID 조회 메서드
    List<Long> findExecutableBuyLimitOrderIds(String symbol, BigDecimal minPrice, int size);

    // 지정가 매도 체결 후보 ID 조회 메서드
    List<Long> findExecutableSellLimitOrderIds(String symbol, BigDecimal maxPrice, int size);

    // 심볼 기준 미체결 지정가 주문 존재 여부 확인 메서드
    boolean existsOpenLimitOrderBySymbol(String symbol);

    // 열린 지정가 주문 심볼 목록 조회 메서드
    List<String> findDistinctOpenLimitSymbols();
}
