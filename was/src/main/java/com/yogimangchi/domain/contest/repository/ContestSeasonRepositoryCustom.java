package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.entity.ContestSeason;

import java.util.List;

public interface ContestSeasonRepositoryCustom {

    // 모집중인 시즌을 커서 기반으로 조회한다.
    List<ContestSeason> searchRecruitingContestSeasons(ContestSeasonSearchDto request);
}
