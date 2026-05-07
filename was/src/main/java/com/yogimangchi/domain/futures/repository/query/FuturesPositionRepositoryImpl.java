package com.yogimangchi.domain.futures.repository.query;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.futures.dto.query.FuturesOpenPositionSymbolCountDto;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

import static com.yogimangchi.domain.futures.entity.QFuturesPosition.futuresPosition;

@Repository
@RequiredArgsConstructor
public class FuturesPositionRepositoryImpl implements FuturesPositionRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Long> findLongLiquidationCandidates(String symbol, BigDecimal minPrice, int size) {
        // 가격이 minPrice 이하로 내려와 LONG 청산이 트리거되는 포지션 ID 조회
        // 조건: liquidationPrice >= minPrice (청산가가 현재 최저가 이상이면 가격이 청산가를 통과)
        return queryFactory
                .select(futuresPosition.id)
                .from(futuresPosition)
                .where(
                        symbolEq(symbol),
                        openLongPosition(),
                        longLiquidationTriggered(minPrice)
                )
                .orderBy(futuresPosition.id.asc()) // 진입 순서 보장
                .limit(size)
                .fetch();
    }

    @Override
    public List<Long> findShortLiquidationCandidates(String symbol, BigDecimal maxPrice, int size) {
        // 가격이 maxPrice 이상으로 올라가 SHORT 청산이 트리거되는 포지션 ID 조회
        // 조건: liquidationPrice <= maxPrice (청산가가 현재 최고가 이하면 가격이 청산가를 통과)
        return queryFactory
                .select(futuresPosition.id)
                .from(futuresPosition)
                .where(
                        symbolEq(symbol),
                        openShortPosition(),
                        shortLiquidationTriggered(maxPrice)
                )
                .orderBy(futuresPosition.id.asc())
                .limit(size)
                .fetch();
    }

    @Override
    public List<FuturesOpenPositionSymbolCountDto> findOpenPositionCountsGroupBySymbol() {
        // 서버 재시작 시 강제청산 Registry 복원용 — 단일 쿼리로 심볼별 OPEN 포지션 카운트 일괄 조회
        // 청산은 자산 만료 여부와 무관하게 처리되어야 하므로 자산 필터 없음 (좀비 포지션 방지)
        return queryFactory
                .select(Projections.constructor(
                        FuturesOpenPositionSymbolCountDto.class,
                        futuresPosition.symbol,
                        futuresPosition.count()
                ))
                .from(futuresPosition)
                .where(openPosition())
                .groupBy(futuresPosition.symbol)
                .fetch();
    }

    private BooleanExpression symbolEq(String symbol) {
        return symbol != null ? futuresPosition.symbol.eq(symbol.trim().toUpperCase()) : null;
    }

    // OPEN 상태 공통 조건
    private BooleanExpression openPosition() {
        return futuresPosition.positionStatus.eq(PositionStatus.OPEN);
    }

    // OPEN + LONG 방향
    private BooleanExpression openLongPosition() {
        return openPosition().and(futuresPosition.positionSide.eq(PositionSide.LONG));
    }

    // OPEN + SHORT 방향
    private BooleanExpression openShortPosition() {
        return openPosition().and(futuresPosition.positionSide.eq(PositionSide.SHORT));
    }

    // LONG 청산 트리거 — 청산가가 현재 가격 범위 최저가 이상일 때 (가격이 떨어져 청산가를 뚫음)
    private BooleanExpression longLiquidationTriggered(BigDecimal minPrice) {
        return minPrice != null ? futuresPosition.liquidationPrice.goe(minPrice) : null;
    }

    // SHORT 청산 트리거 — 청산가가 현재 가격 범위 최고가 이하일 때 (가격이 올라 청산가를 뚫음)
    private BooleanExpression shortLiquidationTriggered(BigDecimal maxPrice) {
        return maxPrice != null ? futuresPosition.liquidationPrice.loe(maxPrice) : null;
    }
}
