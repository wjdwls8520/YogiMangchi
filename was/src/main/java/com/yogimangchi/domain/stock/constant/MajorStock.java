package com.yogimangchi.domain.stock.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MajorStock {
    SAMSUNG("005930", "삼성전자"),
    SK_HYNIX("000660", "SK하이닉스"),
    NAVER("035420", "NAVER"),
    KAKAO("035720", "카카오"),
    HYUNDAI_CAR("005380", "현대차");

    private final String code;
    private final String name;
}
