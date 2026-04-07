package com.yogimangchi.domain.contest.validator;

import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import com.yogimangchi.global.exception.contest.ContestException;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 대회 참가 신청 정책 검증기
 * 대회 시즌이 참가 신청 또는 참가 승인 가능한 상태인지 검증합니다.
 */
@Component
public class ContestApplicationValidator {

    public void validateApplicableContestSeason(ContestSeason contestSeason) {
        validateApplicableContestSeason(contestSeason, LocalDateTime.now());
    }

    public void validateApplicableContestSeason(ContestSeason contestSeason, LocalDateTime now) {
        if (!isApplicableStatus(contestSeason.getStatus())) {
            throw ContestException.contestSeasonNotApplicableStatus();
        }

        if (now.isBefore(contestSeason.getRecruitmentStartAt()) || now.isAfter(contestSeason.getRecruitmentEndAt())) {
            throw ContestException.contestSeasonNotApplicable();
        }
    }

    public void validateApprovableContestSeason(ContestSeason contestSeason) {
        validateApprovableContestSeason(contestSeason, LocalDateTime.now());
    }

    public void validateApprovableContestSeason(ContestSeason contestSeason, LocalDateTime now) {
        if (!isApplicableStatus(contestSeason.getStatus())) {
            throw ContestException.contestSeasonNotApprovableStatus();
        }

        if (now.isBefore(contestSeason.getRecruitmentStartAt()) || now.isAfter(contestSeason.getContestEndAt())) {
            throw ContestException.contestSeasonNotApprovable();
        }
    }

    private boolean isApplicableStatus(ContestSeasonStatus status) {
        return status == ContestSeasonStatus.RECRUITING || status == ContestSeasonStatus.LIVE;
    }
}
