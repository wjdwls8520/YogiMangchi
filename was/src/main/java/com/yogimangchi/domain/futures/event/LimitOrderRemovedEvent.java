package com.yogimangchi.domain.futures.event;

// 지정가 주문 체결 또는 취소 시 발행 — Registry 보유자 수 -1
public record LimitOrderRemovedEvent(String symbol) {}
