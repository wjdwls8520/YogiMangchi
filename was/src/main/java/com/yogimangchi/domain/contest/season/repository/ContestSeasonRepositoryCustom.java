package com.yogimangchi.domain.contest.season.repository;

import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;

import java.time.LocalDateTime;
import java.util.List;

public interface ContestSeasonRepositoryCustom {

    List<ContestSeason> searchApplicableContestSeasons(ContestSeasonSearchDto request, LocalDateTime now);

    List<ContestSeason> searchPublicRecruitingContestSeasons(ContestSeasonSearchDto request, LocalDateTime now);

    List<ContestSeason> searchPublicRunningContestSeasons(ContestSeasonSearchDto request, LocalDateTime now);

    List<ContestSeason> searchPublicFinishedContestSeasons(ContestSeasonSearchDto request, LocalDateTime now);
}
