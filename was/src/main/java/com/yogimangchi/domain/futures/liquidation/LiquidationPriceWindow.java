package com.yogimangchi.domain.futures.liquidation;

import java.math.BigDecimal;

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 파일명 해석
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Liquidation: 강제청산
 *  PriceWindow: 가격 창(窓) / 가격 범위
 *               → 연속된 틱들을 하나의 "범위"로 묶어서 바라보는 창문 개념
 *               → 예) 100 → 103 → 98 틱이 들어오면 min=98, max=103, latest=98 로 누적
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 역할
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  틱이 처리되기 전까지 연속으로 들어오는 가격들을 min / max / latest 로 누적한다.
 *
 *  강제청산 판단 시 latest(최신가)만 사용해도 대부분 충분하지만,
 *  WebSocket 연결이 잠깐 끊겼다가 재연결되거나 틱이 순간적으로 몰리는 상황에서
 *  중간 가격이 청산가를 지나쳤는지 여부를 놓치지 않기 위해 범위를 관리한다.
 *
 *  LONG 포지션 강제청산 조건 : minPrice <= liquidationPrice
 *  SHORT 포지션 강제청산 조건: maxPrice >= liquidationPrice
 *
 *  spot 패키지의 PriceWindow와 동일한 로직이지만,
 *  futures 도메인이 spot 패키지에 의존하면 도메인 경계가 깨지므로 별도 클래스로 분리한다.
 *
 * 제공 메서드
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  single(BigDecimal price)
 *      → 첫 번째 틱으로 초기 범위 생성 (min = max = latest = price)
 *
 *  merge(BigDecimal price)
 *      → 이후 틱이 들어올 때마다 범위 확장 (min은 더 낮게, max는 더 높게, latest는 교체)
 *      → 불변(record) 이므로 기존 객체를 수정하지 않고 새 객체를 반환
 */
public record LiquidationPriceWindow(
        BigDecimal minPrice,
        BigDecimal maxPrice,
        BigDecimal latestPrice
) {

    public static LiquidationPriceWindow single(BigDecimal price) {
        return new LiquidationPriceWindow(price, price, price);
    }

    public LiquidationPriceWindow merge(BigDecimal price) {
        return new LiquidationPriceWindow(
                minPrice.min(price),
                maxPrice.max(price),
                price
        );
    }
}
