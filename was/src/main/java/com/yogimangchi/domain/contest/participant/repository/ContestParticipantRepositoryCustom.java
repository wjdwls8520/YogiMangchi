package com.yogimangchi.domain.contest.participant.repository;

import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipationSeasonQueryDto;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;

import java.time.LocalDateTime;
import java.util.List;

public interface ContestParticipantRepositoryCustom {

    List<ContestParticipantQueryDto> searchContestParticipants(Long seasonId, ContestApplicantSearchDto request);

    List<ContestParticipationSeasonQueryDto> searchParticipatingContestSeasons(Long memberId, ContestCursorSearchDto request, LocalDateTime now);

    List<ContestParticipationSeasonQueryDto> searchContestParticipationSeasons(Long memberId, ContestCursorSearchDto request, LocalDateTime now);
}
