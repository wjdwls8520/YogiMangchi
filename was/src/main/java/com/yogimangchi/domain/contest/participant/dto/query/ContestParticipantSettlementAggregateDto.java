package com.yogimangchi.domain.contest.participant.dto.query;

import java.math.BigDecimal;

/**
 * 정산 과정 중 참가자 최종 실현손익 합산 결과 단위.
 *
 * <p>참가자 한 명에 대해 시즌 전체에서 합산한 두 값을 들고 있는 운반체.
 * Aggregator 가 두 개의 단순 쿼리(실현손익 합 / 시드머니 합)를 각각 실행하고
 * 자바 단에서 한 DTO 로 묶어 반환한다.</p>
 *
 * <ul>
 *   <li>{@code realizedPnlSum} — 시즌 내 모든 CONTEST 지갑의 CLOSE 포지션 realizedPnl 합 (정산 후엔 전체 포지션이 CLOSE)</li>
 *   <li>{@code seedMoneySum} — 시즌 내 모든 CONTEST 지갑의 seedMoney 합 (재도전/회차로 지갑이 여러 개일 경우 대비)</li>
 * </ul>
 *
 * <p>수익률은 본 DTO 가 아니라 Aggregator 에서 계산해 박제한다 — 분모가 0 인 경계 케이스도 거기서 처리.</p>
 */
public record ContestParticipantSettlementAggregateDto(
        Long participantId,
        BigDecimal realizedPnlSum,
        BigDecimal seedMoneySum
) {
}
