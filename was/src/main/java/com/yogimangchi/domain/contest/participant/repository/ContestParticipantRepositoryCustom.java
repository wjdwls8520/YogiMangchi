package com.yogimangchi.domain.contest.participant.repository;

import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipantSettlementAggregateDto;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipationSeasonQueryDto;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.participant.dto.query.MyContestSeasonResultQueryDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ContestParticipantRepositoryCustom {

    List<ContestParticipantQueryDto> searchContestParticipants(Long seasonId, ContestApplicantSearchDto request);

    List<ContestParticipationSeasonQueryDto> searchParticipatingContestSeasons(Long memberId, ContestCursorSearchDto request, LocalDateTime now);

    List<ContestParticipationSeasonQueryDto> searchContestParticipationSeasons(Long memberId, ContestCursorSearchDto request, LocalDateTime now);

    // 참가자 최종 결과 산출용 — 참가자별 (실현손익 합, 시드머니 합) 집계.
    // 두 단순 쿼리를 자바 단에서 묶어 반환. 단일 거대 JOIN 보다 행 중복 위험이 없고 읽기도 쉬움.
    List<ContestParticipantSettlementAggregateDto> findSettlementAggregates(Long seasonId);

    // 사용자 본인의 특정 시즌 결과 단일 조회 — Step E settledAt 분기의 박제값 경로.
    // 참가자 행이 없으면 Optional.empty() 반환 → 서비스에서 NotFound 예외 변환.
    // 참가자 행은 있지만 settledAt 이 NULL 인 케이스도 Optional 비어있지 않게 반환됨 → 서비스에서 분기.
    Optional<MyContestSeasonResultQueryDto> findMyContestSeasonResult(Long memberId, Long seasonId);
}
