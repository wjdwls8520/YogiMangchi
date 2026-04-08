package com.yogimangchi.domain.contest.application.repository;

import com.yogimangchi.domain.contest.application.dto.query.ContestApplicantQueryDto;
import com.yogimangchi.domain.contest.application.dto.query.MyContestPendingApplicationQueryDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantSearchDto;

import java.util.List;

public interface ContestApplicantRepositoryCustom {

    List<ContestApplicantQueryDto> searchContestApplicants(Long seasonId, ContestApplicantSearchDto request);

    List<MyContestPendingApplicationQueryDto> searchPendingContestApplications(Long memberId, ContestCursorSearchDto request);
}
