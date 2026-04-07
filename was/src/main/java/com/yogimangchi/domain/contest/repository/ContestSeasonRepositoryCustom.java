package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.entity.ContestSeason;

import java.util.List;

public interface ContestSeasonRepositoryCustom {

    // 참가 신청 가능한 시즌(RECRUITING, LIVE)을 커서 기반으로 조회한다.
    List<ContestSeason> searchApplicableContestSeasons(ContestSeasonSearchDto request);
}
