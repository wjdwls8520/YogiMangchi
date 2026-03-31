package com.yogimangchi.domain.contest.enums;

// 대회 시즌의 진행 상태를 표현하는 enum
public enum ContestSeasonStatus {
    DRAFT,      // 시즌만 생성된 상태
    RECRUITING, // 참가 신청을 받고 있는 상태
    LIVE,       // 대회가 실제로 진행 중인 상태
    FINISHED,   // 대회가 정상 종료된 상태
    CANCELED    // 대회가 취소된 상태
}
