package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.dto.query.ContestApplicantQueryDto;
import com.yogimangchi.domain.contest.dto.query.MyContestPendingApplicationQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;

import java.util.List;

public interface ContestApplicantRepositoryCustom {

    List<ContestApplicantQueryDto> searchContestApplicants(Long seasonId, ContestApplicantSearchDto request);

    List<MyContestPendingApplicationQueryDto> searchPendingContestApplications(Long memberId, ContestCursorSearchDto request);
}
