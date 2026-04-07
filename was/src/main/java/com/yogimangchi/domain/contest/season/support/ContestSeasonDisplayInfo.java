package com.yogimangchi.domain.contest.season.support;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.enums.ContestSeasonDisplayStatus;

import java.time.LocalDateTime;

// 대회 시즌 엔티티의 날짜/공개 상태를 바탕으로
// 화면에 내려줄 모집중 여부, 라이브 여부, 표시 상태를 계산한다.
public record ContestSeasonDisplayInfo(
        boolean isRecruiting,
        boolean isLive,
        ContestSeasonDisplayStatus displayStatus
) {
    public static ContestSeasonDisplayInfo from(ContestSeason contestSeason, LocalDateTime now) {
        return from(
                contestSeason.isPublic(),
                contestSeason.isCancel(),
                contestSeason.getRecruitmentStartAt(),
                contestSeason.getRecruitmentEndAt(),
                contestSeason.getContestStartAt(),
                contestSeason.getContestEndAt(),
                now
        );
    }

    public static ContestSeasonDisplayInfo from(
            boolean isPublic,
            boolean isCancel,
            LocalDateTime recruitmentStartAt,
            LocalDateTime recruitmentEndAt,
            LocalDateTime contestStartAt,
            LocalDateTime contestEndAt,
            LocalDateTime now
    ) {
        // 비공개이거나 취소된 시즌은 모집중/라이브중으로 보지 않는다.
        boolean isRecruiting = isPublic
                && !isCancel
                && !now.isBefore(recruitmentStartAt)
                && !now.isAfter(recruitmentEndAt);

        boolean isLive = isPublic
                && !isCancel
                && !now.isBefore(contestStartAt)
                && !now.isAfter(contestEndAt);

        // 화면의 대표 상태는 취소 > 비공개 > 종료 > 공개 순서로 계산한다.
        ContestSeasonDisplayStatus displayStatus;
        if (isCancel) {
            displayStatus = ContestSeasonDisplayStatus.CANCELED;
        } else if (!isPublic) {
            displayStatus = ContestSeasonDisplayStatus.DRAFT;
        } else if (now.isAfter(contestEndAt)) {
            displayStatus = ContestSeasonDisplayStatus.FINISHED;
        } else {
            displayStatus = ContestSeasonDisplayStatus.PUBLISHED;
        }

        return new ContestSeasonDisplayInfo(isRecruiting, isLive, displayStatus);
    }
}
