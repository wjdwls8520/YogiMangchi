package com.yogimangchi.domain.contest.validator;

import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import com.yogimangchi.global.exception.contest.ContestException;
import org.springframework.stereotype.Component;

/**
 * 대회 참가 신청 정책 검증기
 * 대회 시즌이 참가 신청 또는 참가 승인 가능한 상태인지 검증합니다.
 */
@Component
public class ContestApplicationValidator {

    public void validateApplicableContestSeason(ContestSeason contestSeason) {
        if (!isApplicableStatus(contestSeason.getStatus())) {
            throw ContestException.contestSeasonNotApplicable();
        }
    }

    public void validateApprovableContestSeason(ContestSeason contestSeason) {
        if (!isApplicableStatus(contestSeason.getStatus())) {
            throw ContestException.contestSeasonNotApprovable();
        }
    }

    private boolean isApplicableStatus(ContestSeasonStatus status) {
        return status == ContestSeasonStatus.RECRUITING || status == ContestSeasonStatus.LIVE;
    }
}
