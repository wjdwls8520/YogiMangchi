package com.yogimangchi.domain.trade.enums;

public enum OrderStatus {
    PENDING,    // 대기 중 (미체결 - 지정가 주문용)
    COMPLETED,  // 체결 완료 (영수증 발급 완료)
    CANCELED    // 주문 취소 (체결 전 취소됨)
}
