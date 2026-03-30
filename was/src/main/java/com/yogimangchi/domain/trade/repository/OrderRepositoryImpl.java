package com.yogimangchi.domain.trade.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.trade.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.query.OrderQueryDto;
import com.yogimangchi.domain.trade.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static com.yogimangchi.domain.asset.entity.QAssets.assets;
import static com.yogimangchi.domain.market.entity.QMarketSymbol.marketSymbol;
import static com.yogimangchi.domain.trade.entity.QOrder.order;

@Repository
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<OrderQueryDto> searchOrders(Long memberId, OrderSearchConditionDto condition, Long assetId) {
        return queryFactory
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
                        assetTypeEq(condition.assetType()),
                        cursorIdLt(condition.cursorId()),
                        symbolEq(condition.symbol()),
                        sideEq(condition.side()),
                        statusEq(condition.status()),
                        dateBetween(condition.startDate(), condition.endDate())
                )
                .orderBy(order.id.desc())
                .limit(condition.getOrDefaultSize() + 1)
                .fetch();
    }

    @Override
    public List<OrderQueryDto> searchOpenOrders(Long memberId, OpenOrderSearchConditionDto condition, Long assetId) {
        return queryFactory
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
                        assetTypeEq(condition.assetType()),
                        symbolEq(condition.symbol()),
                        sideEq(condition.side()),
                        openStatus()
                )
                .orderBy(order.id.desc())
                .fetch();
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

    // 미체결 주문 화면에서는 아직 종료되지 않은 주문만 보여준다
    private BooleanExpression openStatus() {
        return order.status.in(OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED);
    }

    private BooleanExpression dateBetween(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return null;
        }
        if (startDate != null && endDate == null) {
            return order.createdAt.goe(startDate.atStartOfDay());
        }
        if (startDate == null && endDate != null) {
            return order.createdAt.loe(endDate.atTime(LocalTime.MAX));
        }
        return order.createdAt.between(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX));
    }
}
