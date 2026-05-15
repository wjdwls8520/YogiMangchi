package com.yogimangchi.domain.contest.season.enums;

/**
 * 정산 실행의 현재 진행 단계 식별자.
 *
 * <p>settlement_run 의 currentPhase 컬럼에 저장되어 "지금 어느 단계에서 작업 중인지" / "어디서 실패했는지"
 * 를 한눈에 보여준다.</p>
 *
 * <ul>
 *   <li>{@link #PHASE_1_SNAPSHOT}            — 1단계: 가격 스냅샷 캡처</li>
 *   <li>{@link #PHASE_1B_REGISTRY_SYNC}      — 1.5단계: 인메모리 감시 카운트 동기화 (코디네이터 정합성)</li>
 *   <li>{@link #PHASE_2A_WALLET_DEACTIVATE}  — 2단계: 지갑 일괄 비활성화</li>
 *   <li>{@link #PHASE_2B_POSITION_CLOSE}     — 3단계: 포지션 일괄 청산 (가장 무거운 단계)</li>
 *   <li>{@link #PHASE_2C_AGGREGATE}          — 4단계: 참가자 최종 결과 확정</li>
 *   <li>{@link #PHASE_3_MARK_SETTLED}        — 5단계: 정산 완료 마킹</li>
 * </ul>
 *
 * <p>실패 시 settlement_run 의 failedPhase 컬럼에 마지막으로 진입했던 값이 저장된다.</p>
 */
public enum SettlementRunPhase {
    PHASE_1_SNAPSHOT,
    PHASE_1B_REGISTRY_SYNC,
    PHASE_2A_WALLET_DEACTIVATE,
    PHASE_2B_POSITION_CLOSE,
    PHASE_2C_AGGREGATE,
    PHASE_3_MARK_SETTLED
}
