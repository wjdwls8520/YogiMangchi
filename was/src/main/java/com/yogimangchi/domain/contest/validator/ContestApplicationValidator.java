package com.yogimangchi.domain.contest.validator;

import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import com.yogimangchi.global.exception.contest.ContestException;
import org.springframework.stereotype.Component;

/**
 * 대회 참가 신청 정책 검증기
 * 대회 시즌이 참가 신청 가능한 상태인지 검증합니다.
 */
@Component
public class ContestApplicationValidator {

    public void validateRecruitingContestSeason(ContestSeason contestSeason) {
        if (contestSeason.getStatus() != ContestSeasonStatus.RECRUITING) {
            throw ContestException.contestSeasonNotRecruiting();
        }
    }
}
