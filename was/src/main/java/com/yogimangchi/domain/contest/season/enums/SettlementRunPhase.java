package com.yogimangchi.domain.contest.season.enums;

/**
 * 정산 실행의 현재 Phase 식별자.
 *
 * <p>settlement_run 의 currentPhase 컬럼에 저장되어 "지금 어느 단계에서 작업 중인지" / "어디서 실패했는지"
 * 를 한눈에 보여준다.</p>
 *
 * <ul>
 *   <li>{@link #PHASE_1_SNAPSHOT}            — 가격 스냅샷 캡처 단계</li>
 *   <li>{@link #PHASE_2A_POSITION_CLOSE}     — 포지션 일괄 청산 단계 (가장 무거운 단계)</li>
 *   <li>{@link #PHASE_2B_WALLET_DEACTIVATE}  — 지갑 일괄 비활성화 단계</li>
 *   <li>{@link #PHASE_2C_AGGREGATE}          — 참가자 결과 박제 단계</li>
 *   <li>{@link #PHASE_3_MARK_SETTLED}        — 시즌 정산 마킹 단계</li>
 * </ul>
 *
 * <p>실패 시 settlement_run 의 failedPhase 컬럼에 마지막으로 진입했던 값이 저장된다.</p>
 */
public enum SettlementRunPhase {
    PHASE_1_SNAPSHOT,
    PHASE_2A_POSITION_CLOSE,
    PHASE_2B_WALLET_DEACTIVATE,
    PHASE_2C_AGGREGATE,
    PHASE_3_MARK_SETTLED
}
