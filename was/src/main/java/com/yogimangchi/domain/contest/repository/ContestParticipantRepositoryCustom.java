package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;

import java.util.List;

public interface ContestParticipantRepositoryCustom {

    List<ContestParticipantQueryDto> searchContestParticipants(Long seasonId, ContestApplicantSearchDto request);
}
