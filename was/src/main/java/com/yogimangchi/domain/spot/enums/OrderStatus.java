package com.yogimangchi.domain.spot.enums;

public enum OrderStatus {
    PENDING,    // 대기 중 (미체결 - 지정가 주문용)
    PARTIALLY_FILLED, // 부분 체결 (일부 수량만 체결되고 나머지는 대기)
    COMPLETED,  // 체결 완료 (영수증 발급 완료)
    CANCELED    // 주문 취소 (체결 전 취소됨)
}
