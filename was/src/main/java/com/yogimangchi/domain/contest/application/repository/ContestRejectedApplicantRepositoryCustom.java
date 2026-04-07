package com.yogimangchi.domain.contest.application.repository;

import com.yogimangchi.domain.contest.application.dto.query.MyContestLatestRejectedApplicationQueryDto;
import com.yogimangchi.domain.contest.application.dto.query.ContestRejectedApplicantQueryDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantSearchDto;

import java.util.List;

public interface ContestRejectedApplicantRepositoryCustom {

    List<ContestRejectedApplicantQueryDto> searchRejectedContestApplicants(Long seasonId, ContestApplicantSearchDto request);

    MyContestLatestRejectedApplicationQueryDto findLatestRejectedApplication(Long memberId);
}
