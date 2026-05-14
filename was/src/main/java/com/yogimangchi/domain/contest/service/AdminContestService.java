package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.season.dto.response.ContestSettlementResultDto;
import com.yogimangchi.domain.futures.service.FuturesAssetService;
import com.yogimangchi.domain.contest.season.dto.query.ContestSeasonQueryDto;
import com.yogimangchi.domain.contest.application.dto.query.ContestApplicantQueryDto;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.application.dto.query.ContestRejectedApplicantQueryDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantRejectDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.season.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonStatusUpdateDto;
import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonUpdateDto;
import com.yogimangchi.domain.contest.application.dto.response.ContestApplicantDto;
import com.yogimangchi.domain.contest.participant.dto.response.ContestParticipantDto;
import com.yogimangchi.domain.contest.application.dto.response.ContestRejectedApplicantDto;
import com.yogimangchi.domain.contest.application.entity.ContestApplicant;
import com.yogimangchi.domain.contest.season.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.participant.entity.ContestParticipant;
import com.yogimangchi.domain.contest.application.entity.ContestRejectedApplicant;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.repository.AdminContestSeasonRepository;
import com.yogimangchi.domain.contest.application.repository.ContestApplicantRepository;
import com.yogimangchi.domain.contest.participant.repository.ContestParticipantRepository;
import com.yogimangchi.domain.contest.application.repository.ContestRejectedApplicantRepository;
import com.yogimangchi.domain.contest.application.validator.ContestApplicationValidator;
import com.yogimangchi.domain.contest.season.validator.ContestSeasonValidator;
import com.yogimangchi.global.dto.CursorResponseDto;
import com.yogimangchi.global.exception.contest.ContestException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminContestService {

    private final AdminContestSeasonRepository adminContestRepository;
    private final ContestApplicantRepository contestApplicantRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final ContestRejectedApplicantRepository contestRejectedApplicantRepository;
    private final ContestApplicationValidator contestApplicationValidator;
    private final ContestSeasonValidator contestSeasonValidator;

    private final FuturesAssetService futuresAssetsService;

    // 시즌 정산(강제종료) 3단계 처리용 서비스들
    private final ContestSettlementSnapshotService settlementSnapshotService;       // Phase 1 — 가격 스냅샷
    private final ContestSettlementPositionCloser settlementPositionCloser;         // Phase 2a — 포지션 청산
    private final ContestSettlementWalletDeactivator settlementWalletDeactivator;   // Phase 2b — 지갑 비활성화

    @Transactional
    public ContestSeasonDetailDto createContest(Long adminId, ContestCreateDto request) {
        contestSeasonValidator.validateCreateRequest(request);

        ContestSeason contestSeason = ContestSeason.create(
                request.title(),
                request.description(),
                request.recruitmentStartAt(),
                request.recruitmentEndAt(),
                request.contestStartAt(),
                request.contestEndAt()
        );
        ContestSeason savedContestSeason = adminContestRepository.save(contestSeason);

        return ContestSeasonDetailDto.from(savedContestSeason);
    }

    @Transactional
    public ContestSeasonDetailDto updateContestSeason(Long adminId, Long seasonId, ContestSeasonUpdateDto request) {
        contestSeasonValidator.validateUpdateRequest(request);

        ContestSeason contestSeason = adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        contestSeason.updateSeasonInfo(
                request.title(),
                request.description(),
                request.recruitmentStartAt(),
                request.recruitmentEndAt(),
                request.contestStartAt(),
                request.contestEndAt()
        );

        return ContestSeasonDetailDto.from(contestSeason);
    }

    @Transactional
    public ContestSeasonDetailDto updateContestSeasonStatus(Long adminId, Long seasonId, ContestSeasonStatusUpdateDto request) {
        ContestSeason contestSeason = adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        contestSeason.updateStatus(request.isPublic(), request.isCancel());

        return ContestSeasonDetailDto.from(contestSeason);

    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestApplicantDto> getContestApplicants(Long seasonId, ContestApplicantSearchDto request) {
        // 조회 대상 대회 시즌이 실제로 존재하는지 먼저 확인한다.
        adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 아직 승인/반려되지 않은 신청 대기자만 커서 방식으로 조회한다.
        List<ContestApplicantQueryDto> applicants = contestApplicantRepository.searchContestApplicants(seasonId, request);

        int limitSize = request.getOrDefaultSize();
        boolean hasNext = applicants.size() > limitSize;

        if (hasNext) {
            applicants.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!applicants.isEmpty()) {
            nextCursorId = applicants.get(applicants.size() - 1).applicantId();
        }

        List<ContestApplicantDto> content = applicants.stream()
                .map(applicant -> new ContestApplicantDto(
                        applicant.applicantId(),
                        applicant.memberId(),
                        applicant.nickname(),
                        applicant.profileImgUrl(),
                        applicant.appliedAt()
                ))
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional
    public void approveContestApplicant(Long adminId, Long seasonId, Long applicantId) {
        // 요청한 대회 시즌이 존재하는지 먼저 확인한다.
        adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 현재 시즌에 남아 있는 신청 대기자를 비관적 락으로 잡고 순차 처리한다.
        ContestApplicant contestApplicant = contestApplicantRepository.findByIdAndContestSeasonIdForUpdate(applicantId, seasonId)
                .orElseThrow(ContestException::contestApplicantNotFound);

        contestApplicationValidator.validateApprovableContestSeason(contestApplicant.getContestSeason());

        // 이미 참가자로 등록된 회원이면 중복 승인하지 않는다.
        if (contestParticipantRepository.existsByMemberAndContestSeason(
                contestApplicant.getMember(),
                contestApplicant.getContestSeason()
        )) {
            throw ContestException.alreadyParticipating();
        }

        ContestParticipant savedContestParticipant;
        try {
            // 신청 대기자를 실제 참가자 정보로 저장한다.
            ContestParticipant contestParticipant = ContestParticipant.create(contestApplicant, adminId);
            savedContestParticipant = contestParticipantRepository.save(contestParticipant);
        } catch (DataIntegrityViolationException e) {
            // 동시 승인 요청으로 유니크 제약이 걸리더라도 참가중 예외로 통일한다.
            throw ContestException.alreadyParticipating();
        }

        // 참가자 저장이 끝났으면 대기 신청서는 제거한다.
        contestApplicantRepository.delete(contestApplicant);

        // 참가자 신청이 승낙되면 대회용 선물지갑을 생성한다.
        futuresAssetsService.createNewContestFuturesWallet(adminId, savedContestParticipant.getContestSeason(), savedContestParticipant.getMember());
    }

    @Transactional
    public void rejectContestApplicant(
            Long adminId,
            Long seasonId,
            Long applicantId,
            ContestApplicantRejectDto request
    ) {
        // 요청한 대회 시즌이 존재하는지 먼저 확인한다.
        adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 현재 시즌에 남아 있는 신청 대기자를 비관적 락으로 잡고 순차 처리한다.
        ContestApplicant contestApplicant = contestApplicantRepository.findByIdAndContestSeasonIdForUpdate(applicantId, seasonId)
                .orElseThrow(ContestException::contestApplicantNotFound);

        contestApplicationValidator.validateApprovableContestSeason(contestApplicant.getContestSeason());

        // 반려 사유와 함께 반려 이력으로 저장한다.
        ContestRejectedApplicant contestRejectedApplicant =
                ContestRejectedApplicant.create(contestApplicant, request.rejectReason(), adminId);
        contestRejectedApplicantRepository.save(contestRejectedApplicant);

        // 반려가 끝난 신청서는 대기 목록에서 제거한다.
        contestApplicantRepository.delete(contestApplicant);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestParticipantDto> getContestParticipants(Long seasonId, ContestApplicantSearchDto request) {
        // 조회 대상 대회 시즌이 실제로 존재하는지 먼저 확인한다.
        adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 신청 회원과 승인 처리 관리자 정보를 함께 참가자 목록으로 조회한다.
        List<ContestParticipantQueryDto> participants =
                contestParticipantRepository.searchContestParticipants(seasonId, request);

        int limitSize = request.getOrDefaultSize();
        boolean hasNext = participants.size() > limitSize;

        if (hasNext) {
            participants.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!participants.isEmpty()) {
            nextCursorId = participants.get(participants.size() - 1).participantId();
        }

        List<ContestParticipantDto> content = participants.stream()
                .map(participant -> new ContestParticipantDto(
                        participant.participantId(),
                        participant.memberId(),
                        participant.nickname(),
                        participant.profileImgUrl(),
                        participant.appliedAt(),
                        participant.approvedAt(),
                        participant.approvedByAdminId(),
                        participant.approvedByAdminNickname(),
                        participant.approvedByAdminProfileImgUrl()
                ))
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestRejectedApplicantDto> getRejectedContestApplicants(Long seasonId, ContestApplicantSearchDto request) {
        // 조회 대상 대회 시즌이 실제로 존재하는지 먼저 확인한다.
        adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 신청 회원과 반려 처리 관리자 정보를 함께 반려 이력 목록으로 조회한다.
        List<ContestRejectedApplicantQueryDto> rejectedApplicants =
                contestRejectedApplicantRepository.searchRejectedContestApplicants(seasonId, request);

        int limitSize = request.getOrDefaultSize();
        boolean hasNext = rejectedApplicants.size() > limitSize;

        if (hasNext) {
            rejectedApplicants.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!rejectedApplicants.isEmpty()) {
            nextCursorId = rejectedApplicants.get(rejectedApplicants.size() - 1).rejectedApplicantId();
        }

        List<ContestRejectedApplicantDto> content = rejectedApplicants.stream()
                .map(rejectedApplicant -> new ContestRejectedApplicantDto(
                        rejectedApplicant.rejectedApplicantId(),
                        rejectedApplicant.memberId(),
                        rejectedApplicant.nickname(),
                        rejectedApplicant.profileImgUrl(),
                        rejectedApplicant.appliedAt(),
                        rejectedApplicant.rejectedAt(),
                        rejectedApplicant.rejectReason(),
                        rejectedApplicant.rejectedByAdminId(),
                        rejectedApplicant.rejectedByAdminNickname(),
                        rejectedApplicant.rejectedByAdminProfileImgUrl()
                ))
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonDetailDto> getContestSeasons(ContestSeasonSearchDto request) {
        List<ContestSeasonQueryDto> seasons = adminContestRepository.searchContestSeasons(request);
        LocalDateTime now = LocalDateTime.now();

        int limitSize = request.getOrDefaultSize();
        boolean hasNext = seasons.size() > limitSize;

        if (hasNext) {
            seasons.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!seasons.isEmpty()) {
            nextCursorId = seasons.get(seasons.size() - 1).id();
        }

        List<ContestSeasonDetailDto> content = seasons.stream()
            .map(season -> ContestSeasonDetailDto.from(season, false, now))
            .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    // 대회 강제종료(정산) — 어드민 버튼 또는 (미래) 스케줄러에서 호출되는 단일 진입점
    //
    // 이 메서드는 의도적으로 @Transactional 없음
    //   - 각 Phase 가 자기 트랜잭션을 관리 (Phase 1: 단일, Phase 2a: 청크별 REQUIRES_NEW, Phase 2b: 단일)
    //   - 외부 트랜잭션이 있으면 Phase 2a 의 REQUIRES_NEW 가 Phase 1 미커밋 데이터를 못 보는 문제 발생
    //   - 단계별 부분 커밋이지만 모든 Phase 가 멱등하므로 중간 실패 시 재실행 안전
    //
    // 동시성 가드 (2중 방어)
    //   1) 사전 isSettled() 체크 — 빠른 분기 (락 없이, 가장 흔한 멱등 호출 케이스 처리)
    //   2) 사후 markSettledIfNotYet CAS — 동시 두 호출의 race window 보호
    //      (둘 다 사전 체크 통과 → 둘 다 Phase 진행 → CAS 에서 한쪽만 성공)
    //
    // 처리 단계
    //   Phase 1  : 가격 스냅샷 캡처 (시즌 종료 시각의 ticker 가격 박제)
    //   Phase 2a : 포지션 일괄 청산 (스냅샷 기준, 청크 트랜잭션)
    //   Phase 2b : 지갑 일괄 비활성화 (단일 bulk UPDATE)
    //   Phase 3  : CAS 마킹 으로 정산 완료 상태 박제
    public ContestSettlementResultDto settleContestSeason(Long adminId, Long seasonId) {
        // 1) 시즌 조회 + 사전 멱등 체크
        ContestSeason season = adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        if (season.isSettled()) {
            // 이미 정산된 시즌 — 추가 처리 없이 기존 결과 반환 (대부분의 멱등 호출이 이 분기로 빠짐)
            return ContestSettlementResultDto.alreadySettled(
                    season.getId(),
                    season.getTitle(),
                    season.getSettledAt(),
                    season.getParticipantCount().intValue()
            );
        }

        // 2) 정산 기준 시각 — 스냅샷 캡처, markSettled 모두 동일 시각 사용 (감사 일관성)
        LocalDateTime settledAt = LocalDateTime.now();

        // 3) Phase 1 — 가격 스냅샷 캡처
        settlementSnapshotService.captureForSeason(seasonId, settledAt);

        // 4) Phase 2a — 포지션 일괄 청산 (스냅샷 가격 기준)
        int closedPositions = settlementPositionCloser.closeAllOpenPositions(seasonId);

        // 5) Phase 2b — 지갑 일괄 비활성화
        int deactivatedWallets = settlementWalletDeactivator.deactivateForSeason(seasonId);

        // 6) CAS 마킹 — 단일 UPDATE 원자성으로 동시 두 호출 중 한쪽만 성공
        int affected = adminContestRepository.markSettledIfNotYet(seasonId, settledAt);
        if (affected == 0) {
            // 다른 호출이 먼저 markSettled 도달 (드문 race) — 이미 정산됨 응답
            // 리로드하는 이유: 첫 호출의 settledAt 시각을 정확히 반환하기 위함
            ContestSeason reloaded = adminContestRepository.findById(seasonId)
                    .orElseThrow(ContestException::contestSeasonNotFound);
            return ContestSettlementResultDto.alreadySettled(
                    reloaded.getId(),
                    reloaded.getTitle(),
                    reloaded.getSettledAt(),
                    reloaded.getParticipantCount().intValue()
            );
        }

        // 7) 정상 정산 완료 — 카운트 포함 결과 반환
        return ContestSettlementResultDto.of(
                season.getId(),
                season.getTitle(),
                settledAt,
                deactivatedWallets,
                closedPositions,
                season.getParticipantCount().intValue()
        );
    }
}
