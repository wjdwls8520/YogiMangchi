package com.yogimangchi.domain.futures.limitTradeEngine;

import java.math.BigDecimal;

// 지정가 체결 판단용 가격 범위 누적 객체
// 틱 처리 중 유입되는 가격들을 min / max / latest 로 누적해서 체결 조건 판단 시 사용
public record FuturesLimitOrderPriceWindow(
        BigDecimal minPrice,
        BigDecimal maxPrice,
        BigDecimal latestPrice
) {
    // 첫 틱으로 범위 초기화
    public static FuturesLimitOrderPriceWindow single(BigDecimal price) {
        return new FuturesLimitOrderPriceWindow(price, price, price);
    }

    // 이후 틱이 들어올 때마다 범위 확장 — 불변(record)이므로 새 객체 반환
    public FuturesLimitOrderPriceWindow merge(BigDecimal price) {
        return new FuturesLimitOrderPriceWindow(
                minPrice.min(price),
                maxPrice.max(price),
                price
        );
    }
}
