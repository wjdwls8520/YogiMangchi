package com.yogimangchi.domain.contest.season.support;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.enums.ContestSeasonDisplayStatus;

import java.time.LocalDateTime;

// 대회 시즌 엔티티의 날짜/공개/정산 상태를 바탕으로
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
                contestSeason.getSettledAt(),
                now
        );
    }

    // 호환 오버로드 — settledAt 추적이 의미없는 신청/반려 등 DTO 용. 정산 상태 분기 없이 기존 동작 보존.
    // 새 호출 코드는 가급적 8-파라미터 버전을 사용하고 실제 settledAt 을 전달할 것을 권장.
    public static ContestSeasonDisplayInfo from(
            boolean isPublic,
            boolean isCancel,
            LocalDateTime recruitmentStartAt,
            LocalDateTime recruitmentEndAt,
            LocalDateTime contestStartAt,
            LocalDateTime contestEndAt,
            LocalDateTime now
    ) {
        return from(isPublic, isCancel, recruitmentStartAt, recruitmentEndAt, contestStartAt, contestEndAt, null, now);
    }

    // settledAt 파라미터 추가 — 정산 완료된 시즌은 FINISHED 가 아닌 SETTLED 로 분기.
    // 어드민이 contestEndAt 이전에 강제종료한 시즌도 contestEndAt 동기화 + settledAt 박제로
    // 정상적으로 SETTLED 표시 가능. settledAt 미사용 호출처(기존 코드)는 null 전달 가능 — 이 경우
    // FINISHED 로 처리되어 동작 보존.
    public static ContestSeasonDisplayInfo from(
            boolean isPublic,
            boolean isCancel,
            LocalDateTime recruitmentStartAt,
            LocalDateTime recruitmentEndAt,
            LocalDateTime contestStartAt,
            LocalDateTime contestEndAt,
            LocalDateTime settledAt,
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

        // 화면의 대표 상태는 취소 > 비공개 > 정산완료 > 종료 > 공개 순서로 계산한다.
        // 정산완료(SETTLED)는 종료(FINISHED) 보다 상위 — 정산까지 끝난 시즌은 단순 종료 시즌과 구분
        ContestSeasonDisplayStatus displayStatus;
        if (isCancel) {
            displayStatus = ContestSeasonDisplayStatus.CANCELED;
        } else if (!isPublic) {
            displayStatus = ContestSeasonDisplayStatus.DRAFT;
        } else if (settledAt != null) {
            displayStatus = ContestSeasonDisplayStatus.SETTLED;
        } else if (now.isAfter(contestEndAt)) {
            displayStatus = ContestSeasonDisplayStatus.FINISHED;
        } else {
            displayStatus = ContestSeasonDisplayStatus.PUBLISHED;
        }

        return new ContestSeasonDisplayInfo(isRecruiting, isLive, displayStatus);
    }
}
