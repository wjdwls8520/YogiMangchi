package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.season.dto.response.ContestSettlementResultDto;
import com.yogimangchi.domain.contest.season.enums.SettlementRunPhase;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
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

    // 시즌 정산(강제종료) 처리용 서비스들
    private final ContestSettlementSnapshotService settlementSnapshotService;       // Phase 1  — 가격 스냅샷
    private final ContestSettlementPositionCloser settlementPositionCloser;         // Phase 2a — 포지션 청산
    private final ContestSettlementWalletDeactivator settlementWalletDeactivator;   // Phase 2b — 지갑 비활성화
    private final ContestSettlementAggregator settlementAggregator;                 // Phase 2c — 참가자 결과 박제
    private final ContestSettlementRunService settlementRunService;                 // 감사 로그 라이프사이클

    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

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

        // 대회 승인 알림 이벤트 발행
        eventPublisher.publishEvent(new com.yogimangchi.domain.contest.event.ContestApplicationApprovedEvent(
                savedContestParticipant.getMember().getId(),
                savedContestParticipant.getContestSeason().getId(),
                savedContestParticipant.getContestSeason().getTitle()
        ));
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

        // 대회 반려 알림 이벤트 발행
        eventPublisher.publishEvent(new com.yogimangchi.domain.contest.event.ContestApplicationRejectedEvent(
                contestApplicant.getMember().getId(),
                contestApplicant.getContestSeason().getId(),
                contestApplicant.getContestSeason().getTitle(),
                request.rejectReason()
        ));
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

    // 대회 강제종료(정산) — 어드민 버튼 진입점
    //
    // 호출자 정보(adminId)는 향후 감사 로그(settlement_run 테이블) 도입 시 triggeredBy 로 저장 예정.
    // 현재는 로그 라인에 표기하는 용도로만 사용.
    public ContestSettlementResultDto settleContestSeason(Long adminId, Long seasonId) {
        return doSettleContestSeason(seasonId, "ADMIN:" + adminId);
    }

    // 대회 강제종료(정산) — 스케줄러 자동 진입점
    //
    // ContestSettlementScheduler 가 contestEndAt 지난 미정산 시즌에 대해 호출.
    // 멱등성 + 동시성 가드는 doSettleContestSeason 내부에서 동일하게 보장됨.
    public ContestSettlementResultDto settleContestSeasonBySystem(Long seasonId) {
        return doSettleContestSeason(seasonId, "SYSTEM_SCHEDULER");
    }

    // 대회 강제종료(정산) — 어드민 버튼 또는 스케줄러에서 호출되는 단일 진입점
    //
    // 이 메서드는 의도적으로 @Transactional 없음
    //   - 각 단계가 자기 트랜잭션을 관리 (스냅샷: 단일, 포지션청산: 청크별 REQUIRES_NEW, 지갑비활성/결과저장: 단일)
    //   - 외부 트랜잭션이 있으면 포지션청산의 REQUIRES_NEW 가 스냅샷 미커밋 데이터를 못 보는 문제 발생
    //   - 단계별 부분 커밋이지만 모든 단계가 멱등하므로 중간 실패 시 재실행 안전
    //
    // 동시성 가드 (2중 방어)
    //   1) 사전 isSettled() 체크 — 빠른 분기 (락 없이, 가장 흔한 멱등 호출 케이스 처리)
    //   2) 사후 markSettledIfNotYet CAS — 동시 두 호출의 race window 보호
    //      (둘 다 사전 체크 통과 → 둘 다 정산 진행 → CAS 에서 한쪽만 성공)
    //
    // 처리 단계 (순서가 매우 중요하며, 뒷 단계는 앞 단계의 결과에 의존함)
    //   1단계: 가격 스냅샷 캡처     (시즌 종료 시각의 ticker 가격 박제)
    //   2단계: 포지션 일괄 청산     (스냅샷 기준, 청크 트랜잭션)
    //   3단계: 지갑 일괄 비활성화   (단일 bulk UPDATE)
    //   4단계: 참가자 결과 확정     (청산 결과의 realizedPnl 을 합산 → 수익률/순위 산출)
    //   5단계: 완료 마킹(CAS)       (정산 완료 상태 최종 업데이트)
    private ContestSettlementResultDto doSettleContestSeason(Long seasonId, String triggeredBy) {
        // 1) 시즌 조회 + 사전 멱등 체크
        ContestSeason season = adminContestRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        if (season.isSettled()) {
            // 이미 정산된 시즌 — 추가 처리 없이 기존 결과 반환 (대부분의 멱등 호출이 이 분기로 빠짐)
            log.info("[정산] 이미 정산된 시즌 — seasonId={}, triggeredBy={}", seasonId, triggeredBy);
            return ContestSettlementResultDto.alreadySettled(
                    season.getId(),
                    season.getTitle(),
                    season.getSettledAt(),
                    season.getParticipantCount().intValue()
            );
        }

        log.info("[정산] 시작 — seasonId={}, triggeredBy={}", seasonId, triggeredBy);

        // 2) 정산 기준 시각 — 스냅샷 캡처, markSettled, contestEndAt 동기화 모두 동일 시각 사용 (감사 일관성)
        LocalDateTime settledAt = LocalDateTime.now();

        // 3) contestEndAt 동기화 — 어드민이 contestEndAt 이전에 강제종료 버튼을 누른 케이스 대응
        //    거래 쿼리 가드(cs.contestEndAt >= :now)가 즉시 작동해 Phase 2a 진행 중 신규 거래 차단
        //    WHERE cs.contestEndAt > :alignedAt 가드로 이미 지난 시즌(스케줄러 케이스)에선 영향 0
        int aligned = adminContestRepository.alignContestEndAtBeforeSettlement(seasonId, settledAt);
        if (aligned > 0) {
            log.info("[정산] contestEndAt 동기화 (강제종료 케이스) — seasonId={}, alignedAt={}", seasonId, settledAt);
        }

        // 4) settlement_run 시작 — 이후 모든 Phase 가 이 run 에 기록됨
        //    "이미 정산됨" 분기는 위에서 처리되어 여기까지 오지 않음 → 노이즈 없는 이력
        Long runId = settlementRunService.start(seasonId, triggeredBy);

        try {
            // 1단계: 종료 시점의 가격 스냅샷 캡처
            settlementRunService.markPhase(runId, SettlementRunPhase.PHASE_1_SNAPSHOT);
            settlementSnapshotService.captureForSeason(seasonId, settledAt);

            // 2단계: 포지션 일괄 청산 (스냅샷 가격 기준)
            settlementRunService.markPhase(runId, SettlementRunPhase.PHASE_2A_POSITION_CLOSE);
            int closedPositions = settlementPositionCloser.closeAllOpenPositions(seasonId);
            settlementRunService.recordPositionClose(runId, closedPositions);

            // 3단계: 정산 대상 지갑들 일괄 비활성화
            settlementRunService.markPhase(runId, SettlementRunPhase.PHASE_2B_WALLET_DEACTIVATE);
            int deactivatedWallets = settlementWalletDeactivator.deactivateForSeason(seasonId);
            settlementRunService.recordWalletDeactivate(runId, deactivatedWallets);

            // 4단계: 참가자별 최종 실현손익 및 순위 산출/저장 (청산 결과의 realizedPnl 을 기반으로 집계)
            //    반드시 포지션 일괄 청산 이후에 실행해야 함 — 모든 포지션이 CLOSE 되어야 집계가 정확함
            settlementRunService.markPhase(runId, SettlementRunPhase.PHASE_2C_AGGREGATE);
            int finalizedParticipants = settlementAggregator.aggregateForSeason(seasonId);
            settlementRunService.recordParticipantFinalize(runId, finalizedParticipants);

            // 5단계: 정산 완료 상태 최종 업데이트 (CAS 마킹). 단일 UPDATE 원자성으로 동시 두 호출 중 한쪽만 성공
            settlementRunService.markPhase(runId, SettlementRunPhase.PHASE_3_MARK_SETTLED);
            int affected = adminContestRepository.markSettledIfNotYet(seasonId, settledAt);
            if (affected == 0) {
                // 다른 호출이 먼저 markSettled 도달 (드문 race) — 이미 정산됨 응답
                // 우리 쪽 1~4단계 작업은 멱등하므로 데이터 손상 없음. run 은 정상 완료로 마감.
                log.info("[정산] CAS 경합 — 다른 호출이 먼저 markSettled 완료. seasonId={}, triggeredBy={}",
                        seasonId, triggeredBy);
                settlementRunService.markCompleted(runId);

                ContestSeason reloaded = adminContestRepository.findById(seasonId)
                        .orElseThrow(ContestException::contestSeasonNotFound);
                return ContestSettlementResultDto.alreadySettled(
                        reloaded.getId(),
                        reloaded.getTitle(),
                        reloaded.getSettledAt(),
                        reloaded.getParticipantCount().intValue()
                );
            }

            // 9) 정상 종결 — settlement_run COMPLETED
            settlementRunService.markCompleted(runId);

            log.info("[정산] 완료 — seasonId={}, triggeredBy={}, runId={}, closedPositions={}, deactivatedWallets={}, finalizedParticipants={}",
                    seasonId, triggeredBy, runId, closedPositions, deactivatedWallets, finalizedParticipants);

            // 10) 정상 정산 완료 — 카운트 포함 결과 반환
            return ContestSettlementResultDto.of(
                    season.getId(),
                    season.getTitle(),
                    settledAt,
                    deactivatedWallets,
                    closedPositions,
                    season.getParticipantCount().intValue(),
                    finalizedParticipants
            );

        } catch (Exception e) {
            // 어느 단계에서든 예외 발생 시 settlement_run 을 FAILED 로 마감하고 원인 예외 그대로 흘림
            // markFailed 자체는 예외를 swallow 하므로 원인 예외가 가려지지 않음
            log.error("[정산] 실패 — seasonId={}, triggeredBy={}, runId={}", seasonId, triggeredBy, runId, e);
            settlementRunService.markFailed(runId, e.getMessage());
            throw e;
        }
    }
}
