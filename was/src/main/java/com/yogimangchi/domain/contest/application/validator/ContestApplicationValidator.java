package com.yogimangchi.domain.contest.application.validator;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.global.exception.contest.ContestException;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ContestApplicationValidator {

    public void validateApplicableContestSeason(ContestSeason contestSeason) {
        validateApplicableContestSeason(contestSeason, LocalDateTime.now());
    }

    public void validateApplicableContestSeason(ContestSeason contestSeason, LocalDateTime now) {
        if (!isAvailableContestSeason(contestSeason)) {
            throw ContestException.contestSeasonNotApplicableStatus();
        }

        if (!isRecruitingPeriod(contestSeason, now)) {
            throw ContestException.contestSeasonNotApplicable();
        }
    }

    public void validateApprovableContestSeason(ContestSeason contestSeason) {
        validateApprovableContestSeason(contestSeason, LocalDateTime.now());
    }

    public void validateApprovableContestSeason(ContestSeason contestSeason, LocalDateTime now) {
        if (!isAvailableContestSeason(contestSeason)) {
            throw ContestException.contestSeasonNotApprovableStatus();
        }

        if (!isRecruitingPeriod(contestSeason, now)) {
            throw ContestException.contestSeasonNotApprovable();
        }
    }

    private boolean isAvailableContestSeason(ContestSeason contestSeason) {
        return contestSeason.isPublic() && !contestSeason.isCancel();
    }

    private boolean isRecruitingPeriod(ContestSeason contestSeason, LocalDateTime now) {
        return !now.isBefore(contestSeason.getRecruitmentStartAt())
                && !now.isAfter(contestSeason.getRecruitmentEndAt());
    }
}
