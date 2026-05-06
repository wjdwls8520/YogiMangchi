package com.yogimangchi.global.sse.enums;

public enum TradeSseEventType {
    NOTIFICATION_MOCK_ORDER_COMPLETED,
    NOTIFICATION_TRADE_ORDER_COMPLETED,
    NOTIFICATION_CONTEST_ORDER_COMPLETED, // 대회 선물 미체결 주문 완료 타입

    NOTIFICATION_TRADE_LIQUIDATION_COMPLETED, // 본투자 선물 강제청산 완료 타입
    NOTIFICATION_CONTEST_LIQUIDATION_COMPLETED, // 대회 선물 강제청산 완료 타입

    NOTIFICATION_ASSET_TRANSFER_COMPLETED // 자산 이체 완료 알림 타입
}
