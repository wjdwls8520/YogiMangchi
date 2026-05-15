package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.entity.ContestSettlementRun;
import com.yogimangchi.domain.contest.season.enums.SettlementRunPhase;
import com.yogimangchi.domain.contest.season.repository.AdminContestSeasonRepository;
import com.yogimangchi.domain.contest.season.repository.ContestSettlementRunRepository;
import com.yogimangchi.global.exception.contest.ContestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 대회 시즌 정산 실행 이력(settlement_run) 라이프사이클 관리 서비스
 *
 * <p>오케스트레이터(AdminContestService) 가 각 단계 진입 직전/직후로 본 서비스의 메서드를 호출해
 * 어드민이 "정산 어디까지 진행됐는지" / "어디서 실패했는지" 를 실시간으로 추적할 수 있게 한다.</p>
 *
 * <h3>설계 메모</h3>
 * <ul>
 *   <li><b>각 메서드 = REQUIRES_NEW 트랜잭션</b> — 호출 즉시 커밋되어 다른 트랜잭션에서 즉시 가시.
 *       오케스트레이터가 트랜잭션을 갖고 있지 않더라도(현재 그러함) 명시적으로 분리해두면
 *       향후 호출자 구조가 바뀌어도 가시성 보장이 깨지지 않는다.</li>
 *   <li><b>runId 기반 인터페이스</b> — 호출자는 start() 에서 받은 ID 만 들고 다니면 됨.
 *       엔티티를 외부에서 들고 다니지 않아 detached 상태 관리 부담 없음.</li>
 *   <li><b>각 메서드 = SELECT + UPDATE</b> 형태로 다소 비용이 있지만, 정산 처리 전체 부하 대비 무시 가능.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestSettlementRunService {

    private final ContestSettlementRunRepository settlementRunRepository;
    private final AdminContestSeasonRepository adminContestSeasonRepository;

    /**
     * 정산 시작 — RUNNING 상태로 새 settlement_run 행 INSERT.
     *
     * @return 생성된 run ID. 이후 markPhase, recordXxx, markCompleted, markFailed 에 사용
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long start(Long seasonId, String triggeredBy) {
        ContestSeason season = adminContestSeasonRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        ContestSettlementRun run = ContestSettlementRun.start(season, triggeredBy, LocalDateTime.now());
        ContestSettlementRun saved = settlementRunRepository.save(run);

        log.info("[정산 이력] 시작 — runId={}, seasonId={}, triggeredBy={}",
                saved.getId(), seasonId, triggeredBy);
        return saved.getId();
    }

    /**
     * 현재 진행 중인 Phase 마킹 — 각 Phase 호출 직전에 사용.
     *
     * <p>실패 시엔 이 Phase 가 failedPhase 로 자동 박제됨(markFailed 내부 로직).</p>
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markPhase(Long runId, SettlementRunPhase phase) {
        ContestSettlementRun run = findRunOrThrow(runId);
        run.markPhase(phase);
        // dirty checking — 커밋 시 UPDATE 발생
    }

    /** Phase 2a 결과 기록 — 청산된 포지션 수 */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordPositionClose(Long runId, int count) {
        ContestSettlementRun run = findRunOrThrow(runId);
        run.recordPositionClose(count);
    }

    /** Phase 2b 결과 기록 — 비활성화된 지갑 수 */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordWalletDeactivate(Long runId, int count) {
        ContestSettlementRun run = findRunOrThrow(runId);
        run.recordWalletDeactivate(count);
    }

    /** Phase 2c 결과 기록 — 박제된 참가자 수 */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordParticipantFinalize(Long runId, int count) {
        ContestSettlementRun run = findRunOrThrow(runId);
        run.recordParticipantFinalize(count);
    }

    /**
     * 정상 완료 — Phase 3(markSettled) 통과 후 호출.
     * status=COMPLETED, finishedAt=now 박제.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markCompleted(Long runId) {
        ContestSettlementRun run = findRunOrThrow(runId);
        run.markCompleted(LocalDateTime.now());
        log.info("[정산 이력] 정상 완료 — runId={}", runId);
    }

    /**
     * 실패 종결 — 예외 발생 시 호출.
     * status=FAILED, failedPhase=currentPhase, lastErrorMessage=메시지 박제.
     *
     * <p>이 메서드는 호출자의 finally/catch 블록에서 호출되므로 자체 예외는 흘리지 않고
     * 로그로만 남긴다 — settlement_run 갱신 실패가 원인 예외를 가리면 안 되기 때문.</p>
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(Long runId, String errorMessage) {
        try {
            ContestSettlementRun run = findRunOrThrow(runId);
            run.markFailed(LocalDateTime.now(), errorMessage);
            log.warn("[정산 이력] 실패 종결 — runId={}, message={}", runId, errorMessage);
        } catch (Exception e) {
            // settlement_run 갱신 자체가 실패해도 원인 예외를 가리지 않도록 swallow
            log.error("[정산 이력] markFailed 처리 중 추가 오류 — runId={}", runId, e);
        }
    }

    private ContestSettlementRun findRunOrThrow(Long runId) {
        return settlementRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalStateException(
                        "settlement_run 행을 찾을 수 없음 — runId=" + runId
                ));
    }
}
