package com.yogimangchi.domain.futures.repository.query;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.futures.dto.query.FuturesOrderQueryDto;
import com.yogimangchi.domain.futures.dto.query.FuturesPendingSymbolCountDto;
import com.yogimangchi.domain.futures.dto.request.FuturesOrderSearchConditionDto;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static com.yogimangchi.domain.asset.entity.QAssets.assets;
import static com.yogimangchi.domain.futures.entity.QFuturesOrder.futuresOrder;
import static com.yogimangchi.domain.market.entity.QMarketSymbol.marketSymbol;

@Repository
@RequiredArgsConstructor
public class FuturesOrderRepositoryImpl implements FuturesOrderRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<FuturesOrderQueryDto> searchOrders(Long assetsId, FuturesOrderSearchConditionDto condition) {
        return queryFactory
                .select(Projections.constructor(
                        FuturesOrderQueryDto.class,
                        futuresOrder.id,
                        futuresOrder.symbol,
                        marketSymbol.displayNameKr.coalesce(futuresOrder.symbol),
                        futuresOrder.orderType,
                        futuresOrder.orderStatus,
                        futuresOrder.positionSide,
                        futuresOrder.positionAction,
                        futuresOrder.orderPrice,
                        futuresOrder.avgFilledPrice,
                        futuresOrder.orderQuantity,
                        futuresOrder.filledQuantity,
                        futuresOrder.remainingQuantity,
                        futuresOrder.orderMargin,
                        futuresOrder.notionalAmount,
                        futuresOrder.totalFee,
                        futuresOrder.createdAt,
                        futuresOrder.executedAt
                ))
                .from(futuresOrder)
                .join(futuresOrder.assets, assets)
                .leftJoin(marketSymbol).on(futuresOrder.symbol.eq(marketSymbol.symbol))
                .where(
                        assets.id.eq(assetsId),
                        cursorIdLt(condition.cursorId()),
                        symbolEq(condition.symbol()),
                        positionSideEq(condition.positionSide()),
                        positionActionEq(condition.positionAction()),
                        orderStatusEq(condition.orderStatus()),
                        dateBetween(condition.startDate(), condition.endDate())
                )
                .orderBy(futuresOrder.id.desc())
                .limit(condition.getOrDefaultSize() + 1L)
                .fetch();
    }

    @Override
    public List<Long> findExecutableLowerTriggerOrderIds(String symbol, BigDecimal minPrice, int size) {
        // 가격이 minPrice 이하로 내려와 체결 트리거되는 주문 ID 조회
        // 대상: LONG OPEN (싸게 매수) + SHORT CLOSE (익절 매수)
        // 조건: orderPrice >= minPrice
        return queryFactory
                .select(futuresOrder.id)
                .from(futuresOrder)
                .join(futuresOrder.assets, assets)
                .where(
                        symbolEq(symbol),
                        pendingLimitOrder(),
                        activeAssetStatus(),
                        notExpiredAsset(),
                        lowerTriggerSideAction(),
                        lowerTriggerPrice(minPrice)
                )
                .orderBy(futuresOrder.id.asc()) // 주문 등록 순서 보장
                .limit(size)
                .fetch();
    }

    @Override
    public List<Long> findExecutableUpperTriggerOrderIds(String symbol, BigDecimal maxPrice, int size) {
        // 가격이 maxPrice 이상으로 올라가 체결 트리거되는 주문 ID 조회
        // 대상: SHORT OPEN (비싸게 매도) + LONG CLOSE (익절 매도)
        // 조건: orderPrice <= maxPrice
        return queryFactory
                .select(futuresOrder.id)
                .from(futuresOrder)
                .join(futuresOrder.assets, assets)
                .where(
                        symbolEq(symbol),
                        pendingLimitOrder(),
                        activeAssetStatus(),
                        notExpiredAsset(),
                        upperTriggerSideAction(),
                        upperTriggerPrice(maxPrice)
                )
                .orderBy(futuresOrder.id.asc())
                .limit(size)
                .fetch();
    }

    @Override
    public List<FuturesPendingSymbolCountDto> findPendingLimitOrderCountsGroupBySymbol() {
        // 서버 재시작 시 인메모리 Registry 복원용 — 단일 쿼리로 심볼별 PENDING 카운트 일괄 조회
        // 만료/비활성 자산의 주문은 어차피 체결되지 않아야 하므로 카운트에서도 제외
        return queryFactory
                .select(Projections.constructor(
                        FuturesPendingSymbolCountDto.class,
                        futuresOrder.symbol,
                        futuresOrder.count()
                ))
                .from(futuresOrder)
                .join(futuresOrder.assets, assets)
                .where(
                        pendingLimitOrder(),
                        activeAssetStatus(),
                        notExpiredAsset()
                )
                .groupBy(futuresOrder.symbol)
                .fetch();
    }

    @Override
    public List<FuturesPendingSymbolCountDto> findPendingLimitOrderCountsByContestSeason(Long contestSeasonId) {
        // 대회 정산 시 인메모리 Registry 차감용 — 해당 시즌의 PENDING 지정가 주문을 심볼별 카운트
        // 지갑 활성/만료 필터 미적용 — 정산은 시즌 내 모든 잔여 PENDING 주문을 정리해야 하므로
        return queryFactory
                .select(Projections.constructor(
                        FuturesPendingSymbolCountDto.class,
                        futuresOrder.symbol,
                        futuresOrder.count()
                ))
                .from(futuresOrder)
                .join(futuresOrder.assets, assets)
                .where(
                        pendingLimitOrder(),
                        assets.contestSeason.id.eq(contestSeasonId)
                )
                .groupBy(futuresOrder.symbol)
                .fetch();
    }

    @Override
    public List<FuturesPendingSymbolCountDto> findPendingLimitOrderCountsByMemberId(Long memberId) {
        // 회원탈퇴 시 인메모리 Registry 차감용 — 해당 회원의 모든 PENDING 지정가 주문을 심볼별 카운트
        return queryFactory
                .select(Projections.constructor(
                        FuturesPendingSymbolCountDto.class,
                        futuresOrder.symbol,
                        futuresOrder.count()
                ))
                .from(futuresOrder)
                .join(futuresOrder.assets, assets)
                .where(
                        pendingLimitOrder(),
                        assets.member.id.eq(memberId)
                )
                .groupBy(futuresOrder.symbol)
                .fetch();
    }

    // 활성 상태 자산만 — 만료/비활성 자산의 주문은 체결 트리거 대상에서 제외
    private BooleanExpression activeAssetStatus() {
        return assets.status.eq("ACTIVE");
    }

    // 만료 시각이 현재보다 미래인 자산만 (시즌 종료 후 체결 방지)
    private BooleanExpression notExpiredAsset() {
        return assets.expiredAt.goe(LocalDateTime.now());
    }

    // 지정가 + PENDING 공통 조건
    private BooleanExpression pendingLimitOrder() {
        return futuresOrder.orderType.eq(OrderType.LIMIT)
                .and(futuresOrder.orderStatus.eq(OrderStatus.PENDING));
    }

    // 하한 트리거 대상: LONG OPEN ∪ SHORT CLOSE
    private BooleanExpression lowerTriggerSideAction() {
        return (futuresOrder.positionSide.eq(PositionSide.LONG)
                .and(futuresOrder.positionAction.eq(PositionStatus.OPEN)))
                .or(futuresOrder.positionSide.eq(PositionSide.SHORT)
                        .and(futuresOrder.positionAction.eq(PositionStatus.CLOSE)));
    }

    // 상한 트리거 대상: SHORT OPEN ∪ LONG CLOSE
    private BooleanExpression upperTriggerSideAction() {
        return (futuresOrder.positionSide.eq(PositionSide.SHORT)
                .and(futuresOrder.positionAction.eq(PositionStatus.OPEN)))
                .or(futuresOrder.positionSide.eq(PositionSide.LONG)
                        .and(futuresOrder.positionAction.eq(PositionStatus.CLOSE)));
    }

    private BooleanExpression lowerTriggerPrice(BigDecimal minPrice) {
        return minPrice != null ? futuresOrder.orderPrice.goe(minPrice) : null;
    }

    private BooleanExpression upperTriggerPrice(BigDecimal maxPrice) {
        return maxPrice != null ? futuresOrder.orderPrice.loe(maxPrice) : null;
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? futuresOrder.id.lt(cursorId) : null;
    }

    private BooleanExpression symbolEq(String symbol) {
        return StringUtils.hasText(symbol) ? futuresOrder.symbol.eq(symbol.trim().toUpperCase()) : null;
    }

    private BooleanExpression positionSideEq(PositionSide positionSide) {
        return positionSide != null ? futuresOrder.positionSide.eq(positionSide) : null;
    }

    private BooleanExpression positionActionEq(PositionStatus positionAction) {
        return positionAction != null ? futuresOrder.positionAction.eq(positionAction) : null;
    }

    private BooleanExpression orderStatusEq(OrderStatus orderStatus) {
        return orderStatus != null ? futuresOrder.orderStatus.eq(orderStatus) : null;
    }

    private BooleanExpression dateBetween(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) return null;
        if (startDate != null && endDate == null) return futuresOrder.createdAt.goe(startDate.atStartOfDay());
        if (startDate == null) return futuresOrder.createdAt.loe(endDate.atTime(LocalTime.MAX));
        return futuresOrder.createdAt.between(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX));
    }
}
