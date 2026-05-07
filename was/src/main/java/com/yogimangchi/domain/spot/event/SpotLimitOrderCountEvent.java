package com.yogimangchi.domain.spot.event;

/**
 * 현물 지정가 주문의 활성 상태 개수를 변경하기 위한 이벤트
 * @param symbol 대상 심볼 (예: BTCUSDT)
 * @param isIncrement 증가 여부 (true: 신규 생성, false: 체결/취소)
 */
public record SpotLimitOrderCountEvent(
        String symbol,
        boolean isIncrement
) {
}
