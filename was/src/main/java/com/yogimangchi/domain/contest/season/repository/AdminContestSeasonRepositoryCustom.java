package com.yogimangchi.domain.contest.season.repository;

import com.yogimangchi.domain.contest.season.dto.query.ContestSeasonQueryDto;
import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;

import java.util.List;

public interface AdminContestSeasonRepositoryCustom {
    List<ContestSeasonQueryDto> searchContestSeasons(ContestSeasonSearchDto query);
}
