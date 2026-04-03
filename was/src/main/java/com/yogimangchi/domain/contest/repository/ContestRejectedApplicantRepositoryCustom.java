package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.dto.query.MyContestLatestRejectedApplicationQueryDto;
import com.yogimangchi.domain.contest.dto.query.ContestRejectedApplicantQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;

import java.util.List;

public interface ContestRejectedApplicantRepositoryCustom {

    List<ContestRejectedApplicantQueryDto> searchRejectedContestApplicants(Long seasonId, ContestApplicantSearchDto request);

    MyContestLatestRejectedApplicationQueryDto findLatestRejectedApplication(Long memberId);
}
