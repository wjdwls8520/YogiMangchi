package com.yogimangchi.domain.futures.dto.query;

import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// QueryDSL Projections.constructor 전용 내부 쿼리 결과 DTO
public record FuturesOrderQueryDto(
        Long orderId,
        String symbol,
        String displayNameKr,       // MarketSymbol 조인 결과 (없으면 symbol 그대로)
        OrderType orderType,
        OrderStatus orderStatus,
        PositionSide positionSide,
        PositionStatus positionAction,  // OPEN(진입) / CLOSE(청산)
        BigDecimal orderPrice,          // 지정가 주문 시 설정가 (시장가는 null)
        BigDecimal executedPrice,       // 실제 체결 평균가
        BigDecimal orderQuantity,
        BigDecimal filledQuantity,
        BigDecimal remainingQuantity,
        BigDecimal orderMargin,
        BigDecimal notionalAmount,
        BigDecimal totalFee,
        LocalDateTime createdAt,
        LocalDateTime executedAt
) {}
