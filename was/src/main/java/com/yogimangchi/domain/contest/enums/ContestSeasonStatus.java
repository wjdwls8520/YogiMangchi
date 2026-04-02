package com.yogimangchi.domain.contest.enums;

// 대회 시즌의 진행 상태를 표현하는 enum
public enum ContestSeasonStatus {
    DRAFT("생성됨"),
    RECRUITING("모집중"),
    LIVE("진행중"),
    FINISHED("종료"),
    CANCELED("취소");

    private final String label;

    ContestSeasonStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
