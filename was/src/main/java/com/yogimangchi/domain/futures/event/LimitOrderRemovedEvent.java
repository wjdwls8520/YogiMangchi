package com.yogimangchi.domain.futures.event;

// 지정가 주문 체결 또는 취소 시 발행 — Registry 보유자 수를 count 만큼 감소시킨다.
// 단건 발행은 count=1 의 편의 생성자를 사용하고, 일괄 취소(강제청산 후 cleanup 등)는 실제 영향 행 수를 전달한다.
public record LimitOrderRemovedEvent(String symbol, int count) {

    // 단건 이벤트용 편의 생성자 — 기존 호출처와의 호환을 위해 유지
    public LimitOrderRemovedEvent(String symbol) {
        this(symbol, 1);
    }
}
