package com.yogimangchi.domain.futures.repository.query;

import com.yogimangchi.domain.futures.dto.query.FuturesOpenPositionSymbolCountDto;

import java.math.BigDecimal;
import java.util.List;

public interface FuturesPositionRepositoryCustom {

    // 강제청산 — 가격이 minPrice 까지 떨어졌을 때 청산되는 LONG OPEN 포지션 ID 조회
    // 조건: liquidationPrice >= minPrice (가격 하락 시 청산가 위로 잠겨드는 LONG 포지션)
    List<Long> findLongLiquidationCandidates(String symbol, BigDecimal minPrice, int size);

    // 강제청산 — 가격이 maxPrice 까지 올라갔을 때 청산되는 SHORT OPEN 포지션 ID 조회
    // 조건: liquidationPrice <= maxPrice (가격 상승 시 청산가 아래로 노출되는 SHORT 포지션)
    List<Long> findShortLiquidationCandidates(String symbol, BigDecimal maxPrice, int size);

    // 서버 기동 시 — 심볼별 OPEN 포지션 수 일괄 조회 (GROUP BY)
    // 강제청산 Registry 복원용
    List<FuturesOpenPositionSymbolCountDto> findOpenPositionCountsGroupBySymbol();
}
