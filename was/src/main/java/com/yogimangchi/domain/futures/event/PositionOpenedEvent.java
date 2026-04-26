package com.yogimangchi.domain.futures.event;

// 신규 포지션 오픈 시 발행되는 이벤트 객체
public record PositionOpenedEvent(String symbol) {
}
