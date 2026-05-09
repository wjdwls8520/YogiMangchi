package com.yogimangchi.domain.spot.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.spot.dto.query.OrderQueryDto;
import com.yogimangchi.domain.spot.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.spot.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.spot.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static com.yogimangchi.domain.asset.entity.QAssets.assets;
import static com.yogimangchi.domain.market.entity.QMarketSymbol.marketSymbol;
import static com.yogimangchi.domain.spot.entity.QOrder.order;

@Repository
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<OrderQueryDto> searchOrders(Long memberId, AssetType assetType, OrderSearchConditionDto condition, Long assetId) {
        // 주문 내역 목록 조회 쿼리
        return queryFactory
                // 주문 상세와 마켓 표시명 동시 조회
                .select(Projections.constructor(
                        OrderQueryDto.class,
                        order.id,
                        assets.type,
                        order.symbol,
                        marketSymbol.displayNameKr.coalesce(order.symbol),
                        order.orderType,
                        order.side,
                        order.status,
                        order.orderPrice,
                        order.orderQuantity,
                        order.orderAmount,
                        order.filledQuantity,
                        order.remainingQuantity,
                        order.avgFilledPrice,
                        order.executedAmount,
                        order.totalFee,
                        order.createdAt,
                        order.executedAt,
                        order.canceledAt
                ))
                .from(order)
                .join(order.assets, assets)
                .leftJoin(marketSymbol).on(order.symbol.eq(marketSymbol.symbol))
                .where(
                        assetIdEq(assetId),
                        assets.member.id.eq(memberId),
                        assetTypeEq(assetType),
                        cursorIdLt(condition.cursorId()),
                        symbolEq(condition.symbol()),
                        sideEq(condition.side()),
                        statusEq(condition.status()),
                        dateBetween(condition.startDate(), condition.endDate())
                )
                .orderBy(order.id.desc())
                // 다음 페이지 존재 여부 확인을 위한 size + 1 조회
                .limit(condition.getOrDefaultSize() + 1)
                .fetch();
    }

    @Override
    public List<OrderQueryDto> searchOpenOrders(Long memberId, AssetType assetType, OpenOrderSearchConditionDto condition, Long assetId) {
        // 미체결 주문 목록 조회 쿼리
        return queryFactory
                // 주문 상세와 마켓 표시명 동시 조회
                .select(Projections.constructor(
                        OrderQueryDto.class,
                        order.id,
                        assets.type,
                        order.symbol,
                        marketSymbol.displayNameKr.coalesce(order.symbol),
                        order.orderType,
                        order.side,
                        order.status,
                        order.orderPrice,
                        order.orderQuantity,
                        order.orderAmount,
                        order.filledQuantity,
                        order.remainingQuantity,
                        order.avgFilledPrice,
                        order.executedAmount,
                        order.totalFee,
                        order.createdAt,
                        order.executedAt,
                        order.canceledAt
                ))
                .from(order)
                .join(order.assets, assets)
                .leftJoin(marketSymbol).on(order.symbol.eq(marketSymbol.symbol))
                .where(
                        assetIdEq(assetId),
                        assets.member.id.eq(memberId),
                        assetTypeEq(assetType),
                        cursorIdLt(condition.cursorId()),
                        symbolEq(condition.symbol()),
                        sideEq(condition.side()),
                        openStatus()
                )
                .orderBy(order.id.desc())
                // 다음 페이지 존재 여부 확인을 위한 size + 1 조회
                .limit(condition.getOrDefaultSize() + 1)
                .fetch();
    }

    @Override
    public List<Long> findExecutableBuyLimitOrderIds(String symbol, BigDecimal minPrice, int size) {
        // 가격 하한 이상 매수 지정가 체결 후보 조회
        return queryFactory
                .select(order.id)
                .from(order)
                .join(order.assets, assets)
                .where(
                        activeAssetStatus(),
                        notExpiredAsset(),
                        symbolEq(symbol),
                        limitOrderType(),
                        buySide(),
                        openStatus(),
                        executableBuyPrice(minPrice)
                )
                .orderBy(order.id.asc())
                .limit(size)
                .fetch();
    }

    @Override
    public List<Long> findExecutableSellLimitOrderIds(String symbol, BigDecimal maxPrice, int size) {
        // 가격 상한 이하 매도 지정가 체결 후보 조회
        return queryFactory
                .select(order.id)
                .from(order)
                .join(order.assets, assets)
                .where(
                        activeAssetStatus(),
                        notExpiredAsset(),
                        symbolEq(symbol),
                        limitOrderType(),
                        sellSide(),
                        openStatus(),
                        executableSellPrice(maxPrice)
                )
                .orderBy(order.id.asc())
                .limit(size)
                .fetch();
    }

    @Override
    public boolean existsOpenLimitOrderBySymbol(String symbol) {
        // 심볼 기준 미체결 지정가 주문 존재 여부 확인
        Integer exists = queryFactory
                .selectOne()
                .from(order)
                .join(order.assets, assets)
                .where(
                        activeAssetStatus(),
                        notExpiredAsset(),
                        symbolEq(symbol),
                        limitOrderType(),
                        openStatus()
                )
                .fetchFirst();

        return exists != null;
    }

    @Override
    public Map<String, Long> countOpenLimitOrdersPerSymbol() {
        // 서버 기동 시 복구할 심볼별 미체결 지정가 주문 개수 조회
        return queryFactory
                .select(order.symbol, order.count())
                .from(order)
                .join(order.assets, assets)
                .where(
                        activeAssetStatus(),
                        notExpiredAsset(),
                        limitOrderType(),
                        openStatus()
                )
                .groupBy(order.symbol)
                .fetch()
                .stream()
                .collect(Collectors.toMap(
                        tuple -> tuple.get(order.symbol),
                        tuple -> tuple.get(order.count())
                ));
    }

    private BooleanExpression assetTypeEq(AssetType assetType) {
        return assetType != null ? assets.type.eq(assetType) : null;
    }

    private BooleanExpression assetIdEq(Long assetId) {
        return assetId != null ? assets.id.eq(assetId) : null;
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? order.id.lt(cursorId) : null;
    }

    private BooleanExpression symbolEq(String symbol) {
        return StringUtils.hasText(symbol) ? order.symbol.eq(symbol) : null;
    }

    private BooleanExpression sideEq(String side) {
        return StringUtils.hasText(side) ? order.side.eq(side) : null;
    }

    private BooleanExpression statusEq(OrderStatus status) {
        return status != null ? order.status.eq(status) : null;
    }

    // 지정가 주문 조건
    private BooleanExpression limitOrderType() {
        return order.orderType.eq("LIMIT");
    }

    // 매수 주문 조건
    private BooleanExpression buySide() {
        return order.side.eq("BUY");
    }

    // 매도 주문 조건
    private BooleanExpression sellSide() {
        return order.side.eq("SELL");
    }

    // 미체결 주문 화면 노출 대상 상태 조건
    private BooleanExpression openStatus() {
        return order.status.in(OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED);
    }

    private BooleanExpression activeAssetStatus() {
        return assets.status.eq("ACTIVE");
    }

    private BooleanExpression notExpiredAsset() {
        return assets.expiredAt.goe(LocalDateTime.now());
    }

    // 최저가 범위 돌파 기준 매수 체결 조건
    private BooleanExpression executableBuyPrice(BigDecimal minPrice) {
        return minPrice != null ? order.orderPrice.goe(minPrice) : null;
    }

    // 최고가 범위 돌파 기준 매도 체결 조건
    private BooleanExpression executableSellPrice(BigDecimal maxPrice) {
        return maxPrice != null ? order.orderPrice.loe(maxPrice) : null;
    }

    private BooleanExpression dateBetween(LocalDate startDate, LocalDate endDate) {
        // 주문 생성 시각 기준 기간 필터
        if (startDate == null && endDate == null) {
            return null;
        }
        if (startDate != null && endDate == null) {
            // 시작일 이후 범위 조건
            return order.createdAt.goe(startDate.atStartOfDay());
        }
        if (startDate == null && endDate != null) {
            // 종료일 포함 범위 조건
            return order.createdAt.loe(endDate.atTime(LocalTime.MAX));
        }
        // 시작일과 종료일 모두 포함하는 범위 조건
        return order.createdAt.between(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX));
    }
}
