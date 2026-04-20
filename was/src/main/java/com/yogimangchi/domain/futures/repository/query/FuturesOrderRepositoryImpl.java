package com.yogimangchi.domain.futures.repository.query;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.futures.dto.query.FuturesOrderQueryDto;
import com.yogimangchi.domain.futures.dto.request.FuturesOrderSearchConditionDto;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
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
