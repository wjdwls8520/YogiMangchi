package com.yogimangchi.domain.contest.season.enums;

public enum ContestSeasonDisplayStatus {
    DRAFT("생성됨"),
    PUBLISHED("공개중"),
    FINISHED("종료"),
    SETTLED("정산완료"),
    CANCELED("취소");

    private final String label;

    ContestSeasonDisplayStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
