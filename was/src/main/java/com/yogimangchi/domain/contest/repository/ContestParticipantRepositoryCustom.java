package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.dto.query.ContestParticipationSeasonQueryDto;
import com.yogimangchi.domain.contest.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.dto.request.ContestCursorSearchDto;

import java.util.List;

public interface ContestParticipantRepositoryCustom {

    List<ContestParticipantQueryDto> searchContestParticipants(Long seasonId, ContestApplicantSearchDto request);

    List<ContestParticipationSeasonQueryDto> searchParticipatingContestSeasons(Long memberId, ContestCursorSearchDto request);

    List<ContestParticipationSeasonQueryDto> searchContestParticipationSeasons(Long memberId, ContestCursorSearchDto request);
}
