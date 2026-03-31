package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.dto.query.ContestSeasonQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;

import java.util.List;

public interface ContestSeasonRepositoryCustom {
    List<ContestSeasonQueryDto> searchContestSeasons(ContestSeasonSearchDto query);
}
