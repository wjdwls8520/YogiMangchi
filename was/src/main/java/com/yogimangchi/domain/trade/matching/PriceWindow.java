package com.yogimangchi.domain.trade.matching;

import java.math.BigDecimal;

public record PriceWindow(
        BigDecimal minPrice,
        BigDecimal maxPrice,
        BigDecimal latestPrice
) {

    // 단일 가격 기반 초기 범위 생성
    public static PriceWindow single(BigDecimal price) {
        return new PriceWindow(price, price, price);
    }

    // 누적 틱 기준 최소·최대·최신 가격 갱신
    public PriceWindow merge(BigDecimal price) {
        return new PriceWindow(
                minPrice.min(price),
                maxPrice.max(price),
                price
        );
    }
}
