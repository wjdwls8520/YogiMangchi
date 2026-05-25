package com.yogimangchi.domain.futures.repository.query;

import com.yogimangchi.domain.futures.dto.query.FuturesOrderQueryDto;
import com.yogimangchi.domain.futures.dto.query.FuturesPendingSymbolCountDto;
import com.yogimangchi.domain.futures.dto.request.FuturesOrderSearchConditionDto;

import java.math.BigDecimal;
import java.util.List;

public interface FuturesOrderRepositoryCustom {

    // 지갑 기준 선물 주문 내역 조회 (체결/미체결 통합, 커서 방식)
    List<FuturesOrderQueryDto> searchOrders(Long assetsId, FuturesOrderSearchConditionDto condition);

    // 지정가 체결 — 가격이 minPrice 까지 떨어졌을 때 체결되는 주문 ID 조회
    // 대상: LONG OPEN (싸게 매수) + SHORT CLOSE (익절 매수)
    // 조건: orderPrice >= minPrice
    List<Long> findExecutableLowerTriggerOrderIds(String symbol, BigDecimal minPrice, int size);

    // 지정가 체결 — 가격이 maxPrice 까지 올랐을 때 체결되는 주문 ID 조회
    // 대상: SHORT OPEN (비싸게 매도) + LONG CLOSE (익절 매도)
    // 조건: orderPrice <= maxPrice
    List<Long> findExecutableUpperTriggerOrderIds(String symbol, BigDecimal maxPrice, int size);

    // 서버 기동 시 — 심볼별 PENDING 지정가 주문 수 일괄 조회 (GROUP BY)
    List<FuturesPendingSymbolCountDto> findPendingLimitOrderCountsGroupBySymbol();

    // 대회 정산 시 — 해당 시즌의 PENDING 지정가 주문을 심볼별 카운트 (인메모리 차감용)
    List<FuturesPendingSymbolCountDto> findPendingLimitOrderCountsByContestSeason(Long contestSeasonId);

    // 회원탈퇴 시 — 해당 회원의 PENDING 지정가 주문을 심볼별 카운트 (인메모리 차감용)
    List<FuturesPendingSymbolCountDto> findPendingLimitOrderCountsByMemberId(Long memberId);
}
