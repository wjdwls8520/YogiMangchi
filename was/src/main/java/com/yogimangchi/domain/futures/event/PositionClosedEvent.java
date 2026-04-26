package com.yogimangchi.domain.futures.event;

// 포지션 완전 청산 시 발행되는 이벤트 객체
public record PositionClosedEvent(String symbol) {
}
