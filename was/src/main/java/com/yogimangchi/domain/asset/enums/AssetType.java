package com.yogimangchi.domain.asset.enums;

public enum AssetType {
    MOCK,           // 모의투자 (현물 단일계좌)
    TRADE_SPOT,     // 실전 트레이드 현물
    TRADE_FUTURE,   // 실전 트레이드 선물
    CONTEST         // 대회용 (선물)
}
