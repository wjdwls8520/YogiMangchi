package com.yogimangchi.domain.contest.application.enums;

// 대회 신청자 상태를 표현하는 enum
public enum ContestApplicantStatus {
    PENDING("승인 대기"),
    APPROVED("승인 완료"),
    REJECTED("반려");

    private final String label;

    ContestApplicantStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
