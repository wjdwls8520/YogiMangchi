package com.yogimangchi.domain.futures.event;

// 지정가 주문 등록 시 발행 — Registry 보유자 수 +1
public record LimitOrderPlacedEvent(String symbol) {}
