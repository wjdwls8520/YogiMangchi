package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.participant.dto.response.ContestRankingDto;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipationSeasonQueryDto;
import com.yogimangchi.domain.contest.participant.dto.query.MyContestSeasonResultQueryDto;
import com.yogimangchi.domain.contest.participant.dto.response.MyContestSeasonResultDto;
import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.participant.dto.response.ContestParticipationSeasonDto;
import com.yogimangchi.domain.contest.season.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.application.dto.response.MyContestPendingApplicationDto;
import com.yogimangchi.domain.contest.application.dto.response.MyContestLatestRejectedApplicationDto;
import com.yogimangchi.domain.contest.season.dto.response.ContestSeasonStatusResponseDto;
import com.yogimangchi.domain.contest.application.dto.query.MyContestPendingApplicationQueryDto;
import com.yogimangchi.domain.contest.application.dto.query.MyContestLatestRejectedApplicationQueryDto;
import com.yogimangchi.domain.contest.application.entity.ContestApplicant;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.enums.ContestSeasonDisplayStatus;
import com.yogimangchi.domain.contest.application.repository.ContestApplicantRepository;
import com.yogimangchi.domain.contest.participant.repository.ContestParticipantRepository;
import com.yogimangchi.domain.contest.application.repository.ContestRejectedApplicantRepository;
import com.yogimangchi.domain.contest.season.repository.ContestSeasonRepository;
import com.yogimangchi.domain.contest.application.validator.ContestApplicationValidator;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.global.dto.CursorResponseDto;
import com.yogimangchi.global.exception.contest.ContestException;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestSeasonRepository contestSeasonRepository;
    private final ContestApplicantRepository contestApplicantRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final ContestRejectedApplicantRepository contestRejectedApplicantRepository;
    private final ContestApplicationValidator contestApplicationValidator;

    private final MemberReader memberReader;

    @Transactional(readOnly = true)
    public List<ContestSeasonStatusResponseDto> getContestSeasonStatuses() {
        return List.of(ContestSeasonDisplayStatus.values()).stream()
                .map(ContestSeasonStatusResponseDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MyContestLatestRejectedApplicationDto getMyLatestRejectedContestApplication(Long loginMemberId) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        LocalDateTime now = LocalDateTime.now();

        MyContestLatestRejectedApplicationQueryDto latestRejectedApplication =
                contestRejectedApplicantRepository.findLatestRejectedApplication(member.getId());

        if (latestRejectedApplication == null) {
            return null;
        }

        return latestRejectedApplication.toResponseDto(now);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<MyContestPendingApplicationDto> getMyPendingContestApplications(
            Long loginMemberId,
            ContestCursorSearchDto request
    ) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        LocalDateTime now = LocalDateTime.now();

        List<MyContestPendingApplicationQueryDto> pendingApplications =
                contestApplicantRepository.searchPendingContestApplications(member.getId(), request);

        int limitSize = request.getOrDefaultSize();

        if (pendingApplications.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = pendingApplications.size() > limitSize;

        if (hasNext) {
            pendingApplications = new ArrayList<>(pendingApplications.subList(0, limitSize));
        }

        List<MyContestPendingApplicationDto> content = pendingApplications.stream()
                .map(application -> application.toResponseDto(now))
                .toList();

        Long nextCursorId = hasNext
                ? pendingApplications.get(pendingApplications.size() - 1).applicantId()
                : null;

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestParticipationSeasonDto> getMyParticipatingContestSeasons(
            Long loginMemberId,
            ContestCursorSearchDto request
    ) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        LocalDateTime now = LocalDateTime.now();

        List<ContestParticipationSeasonQueryDto> participationSeasons =
                contestParticipantRepository.searchParticipatingContestSeasons(member.getId(), request, now);

        return toContestParticipationCursorResponse(participationSeasons, request.getOrDefaultSize(), now);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestParticipationSeasonDto> getMemberContestParticipationSeasons(
            Long memberId,
            ContestCursorSearchDto request
    ) {
        Member member = memberReader.getFindMember(memberId);
        LocalDateTime now = LocalDateTime.now();

        List<ContestParticipationSeasonQueryDto> participationSeasons =
                contestParticipantRepository.searchContestParticipationSeasons(member.getId(), request, now);

        return toContestParticipationCursorResponse(participationSeasons, request.getOrDefaultSize(), now);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonDetailDto> getApplicableContestSeasons(Long loginMemberId, ContestSeasonSearchDto request) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        LocalDateTime now = LocalDateTime.now();

        int limitSize = request.getOrDefaultSize();

        List<ContestSeason> contestSeasons = contestSeasonRepository.searchApplicableContestSeasons(request, now);

        if (contestSeasons.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = contestSeasons.size() > limitSize;

        if (hasNext) {
            contestSeasons = new ArrayList<>(contestSeasons.subList(0, limitSize));
        }

        List<Long> seasonIds = contestSeasons.stream()
                .map(ContestSeason::getId)
                .toList();
        List<Long> pendingSeasonIds = contestApplicantRepository.findPendingSeasonIds(member.getId(), seasonIds);

        List<Long> participatingSeasonIds = contestParticipantRepository.findParticipatingSeasonIds(member.getId(), seasonIds);

        List<ContestSeasonDetailDto> content = contestSeasons.stream()
                .map(contestSeason -> ContestSeasonDetailDto.from(
                        contestSeason,
                        pendingSeasonIds.contains(contestSeason.getId())
                                || participatingSeasonIds.contains(contestSeason.getId()),
                        now
                ))
                .toList();

        Long nextCursorId = hasNext && !contestSeasons.isEmpty()
                ? contestSeasons.get(contestSeasons.size() - 1).getId()
                : null;

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional
    public void applyContestSeason(Long loginMemberId, Long seasonId) {
        Member member = memberReader.getAuthenticated(loginMemberId);

        ContestSeason contestSeason = contestSeasonRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        contestApplicationValidator.validateApplicableContestSeason(contestSeason);

        if (contestApplicantRepository.existsByMemberAndContestSeason(member, contestSeason)) {
            throw ContestException.duplicateApplication();
        }

        if (contestParticipantRepository.existsByMemberAndContestSeason(member, contestSeason)) {
            throw ContestException.alreadyParticipating();
        }

        try {
            contestApplicantRepository.save(ContestApplicant.create(contestSeason, member));
        } catch (DataIntegrityViolationException e) {
            throw ContestException.duplicateApplication();
        }
    }

    private CursorResponseDto<ContestParticipationSeasonDto> toContestParticipationCursorResponse(
            List<ContestParticipationSeasonQueryDto> participationSeasons,
            int limitSize,
            LocalDateTime now
    ) {
        if (participationSeasons.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = participationSeasons.size() > limitSize;

        if (hasNext) {
            participationSeasons = new ArrayList<>(participationSeasons.subList(0, limitSize));
        }

        List<ContestParticipationSeasonDto> content = participationSeasons.stream()
                .map(participationSeason -> participationSeason.toResponseDto(now))
                .toList();

        Long nextCursorId = hasNext
                ? participationSeasons.get(participationSeasons.size() - 1).participantId()
                : null;

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    // 내 시즌 정산 결과 조회 — settledAt 분기 후 박제값(final_*) 단일 SELECT 응답
    //
    // 분기 로직
    //   1) 참가자 존재 안 함 → CONTEST_PARTICIPANT_NOT_FOUND (404)
    //   2) 참가자는 존재하지만 시즌이 미정산(settledAt IS NULL) → CONTEST_SEASON_NOT_SETTLED (409)
    //      프론트는 이 코드로 "정산 대기 중" UI 분기. 진행 중 실시간 PnL 은 별도 wallet/포지션 API 에서 처리.
    //   3) 정산 완료 → 박제값 그대로 응답 (실시간 계산 없음, 단일 SELECT)
    //
    // 비정규화(Frozen Aggregate) 의 효과
    //   - 정산 시점에 한 번 박힌 final_realized_pnl/profit_rate/rank 를 그대로 SELECT 만 함
    //   - 매 호출마다 다시 합산/순위 산정하지 않으므로 응답 일관성 + 빠른 응답 보장
    @Transactional(readOnly = true)
    public MyContestSeasonResultDto getMyContestSeasonResult(Long loginMemberId, Long seasonId) {
        // 인증 가드 — 비활성/탈퇴 회원 차단
        Member member = memberReader.getAuthenticated(loginMemberId);

        MyContestSeasonResultQueryDto result = contestParticipantRepository
                .findMyContestSeasonResult(member.getId(), seasonId)
                .orElseThrow(ContestException::contestParticipantNotFound);

        // 정산 미완료 시즌은 박제 컬럼이 모두 NULL — 명시적 분기로 사용자에게 의도를 알림
        if (result.settledAt() == null) {
            throw ContestException.contestSeasonNotSettled();
        }

        return result.toResponseDto();
    }

    /**
     * 특정 시즌의 전체 순위 리스트를 조회한다. (무한 스크롤)
     *
     * @param seasonId 조회할 시즌 ID
     * @param request  커서 및 사이즈 조건
     * @return 순위순으로 정렬된 커서 응답
     */
    @Transactional(readOnly = true)
    public CursorResponseDto<ContestRankingDto> getContestRankings(Long seasonId, ContestCursorSearchDto request) {
        // 시즌 존재 여부 확인
        ContestSeason season = contestSeasonRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 정산이 완료되지 않은 시즌은 랭킹 데이터(final_*)가 없으므로 빈 리스트 반환
        if (season.getSettledAt() == null) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        // 박제된 데이터를 기반으로 순위순 조회 (N+1 방지 및 커서 페이징 지원 쿼리 사용)
        List<ContestRankingDto> rankings = contestParticipantRepository.findContestRankings(seasonId, request);

        int limitSize = request.getOrDefaultSize();
        boolean hasNext = rankings.size() > limitSize;

        if (hasNext) {
            rankings = new ArrayList<>(rankings.subList(0, limitSize));
        }

        Long nextCursorId = hasNext
                ? rankings.get(rankings.size() - 1).participantId()
                : null;

        return new CursorResponseDto<>(rankings, nextCursorId, hasNext);
    }

    /**
     * 특정 회원의 특정 시즌 순위 정보를 조회한다.
     *
     * @param seasonId 조회할 시즌 ID
     * @param memberId 조회할 회원 ID
     * @return 특정 회원의 순위 정보
     */
    @Transactional(readOnly = true)
    public ContestRankingDto getMemberContestRanking(Long seasonId, Long memberId) {
        // 시즌 존재 여부 확인
        ContestSeason season = contestSeasonRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 정산이 완료되지 않은 시즌은 랭킹 데이터(final_*)가 없으므로 409 Conflict 반환
        if (season.getSettledAt() == null) {
            throw ContestException.contestSeasonNotSettled();
        }

        // 특정 회원의 박제된 순위 정보 조회
        return contestParticipantRepository.findContestRankingByMemberId(seasonId, memberId)
                .orElseThrow(ContestException::contestParticipantNotFound);
    }
}
