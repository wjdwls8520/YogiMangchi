package com.yogimangchi.domain.contest.season.enums;

/**
 * 정산 실행 상태 — settlement_run 한 행의 라이프사이클을 나타낸다.
 *
 * <ul>
 *   <li>{@link #RUNNING}   — 정산 진행 중 (현재 어느 Phase 인지는 currentPhase 컬럼이 알려줌)</li>
 *   <li>{@link #COMPLETED} — Phase 3(markSettled) 까지 정상 완료</li>
 *   <li>{@link #FAILED}    — 중간에 예외 발생. lastErrorMessage / failedPhase 로 원인 추적</li>
 * </ul>
 *
 * <p>FAILED 상태가 남아있더라도 멱등 가드(이미 CLOSED 포지션, 이미 INACTIVE 지갑) 덕분에
 * 어드민이 정산 버튼을 다시 누르거나 스케줄러가 다음 틱에서 재시도하면 자연 회복된다.</p>
 */
public enum SettlementRunStatus {
    RUNNING,
    COMPLETED,
    FAILED
}
