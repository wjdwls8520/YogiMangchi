package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipantSettlementAggregateDto;
import com.yogimangchi.domain.contest.participant.entity.ContestParticipant;
import com.yogimangchi.domain.contest.participant.repository.ContestParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 대회 시즌 정산 Phase 2c — 참가자별 최종 결과 박제 (Frozen Aggregate)
 *
 * <p>Phase 2a 완료 후(=시즌 내 모든 포지션이 CLOSE 상태) 호출되어, 각 참가자의 최종 실현손익/수익률/순위를
 * 산정하고 {@code contest_participant} 테이블에 한 번만 박는다. 이후로는 read-only.</p>
 *
 * <h3>처리 단계</h3>
 * <ol>
 *   <li>참가자별 (실현손익 합, 시드머니 합) 집계 — 단일 호출, 내부 2 쿼리</li>
 *   <li>수익률 산출 — (pnlSum / seedSum) × 100. seedSum 이 0 인 경계 케이스는 0% 처리</li>
 *   <li>RANK 산정 — 실현손익 내림차순. 동률 시 같은 순위, 다음 순위는 건너뜀(1,2,2,4 올림픽 방식)</li>
 *   <li>참가자 일괄 로드 + dirty checking 으로 박제</li>
 * </ol>
 *
 * <h3>정확성 보장</h3>
 * <ul>
 *   <li><b>N+1 방지</b> — 집계 2 쿼리 + 참가자 일괄 로드 1 쿼리 = 총 3 쿼리</li>
 *   <li><b>정합성</b> — 단일 @Transactional 안에서 로드 → 산정 → 박제 모두 수행. 중간 실패 시 전체 롤백</li>
 *   <li><b>멱등</b> — 재실행 시 같은 입력 → 같은 결과(같은 값 덮어쓰기). markFinalResult 자체에 가드 없음</li>
 *   <li><b>데드락 방지</b> — 단일 테이블(contest_participant) UPDATE, 외부 락 없음</li>
 * </ul>
 *
 * <h3>호출 시점</h3>
 * <p>{@link AdminContestService#doSettleContestSeason} 내부에서 Phase 2a 직후, Phase 3(markSettled) 직전에 호출.
 * 모든 포지션이 CLOSE 된 상태를 전제로 한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestSettlementAggregator {

    // 수익률 소수점 자리수 — contest_participant.final_profit_rate 의 scale 과 일치시킴
    private static final int PROFIT_RATE_SCALE = 4;

    // 수익률 계산에 사용하는 백분율 환산 상수 — (pnl/seed) × 100
    private static final BigDecimal PERCENT_MULTIPLIER = new BigDecimal("100");

    private final ContestParticipantRepository contestParticipantRepository;

    /**
     * 시즌 내 모든 참가자의 최종 결과를 박제한다.
     *
     * @param seasonId 정산 대상 시즌 ID
     * @return 박제 처리된 참가자 수 (시즌 참가자 수와 동일. 멱등 재호출 시도 동일)
     */
    @Transactional
    public int aggregateForSeason(Long seasonId) {

        // 1) 참가자별 집계 로드 (내부 2 쿼리)
        List<ContestParticipantSettlementAggregateDto> aggregates =
                contestParticipantRepository.findSettlementAggregates(seasonId);

        if (aggregates.isEmpty()) {
            // 참가자 없는 시즌 — 처리할 것 없음 (정상 케이스로 간주, 예외 아님)
            log.info("[정산 집계] 참가자 없음 — seasonId={}", seasonId);
            return 0;
        }

        // 2) 실현손익 내림차순 정렬 → RANK 산정의 사전 조건
        aggregates.sort(Comparator.comparing(
                ContestParticipantSettlementAggregateDto::realizedPnlSum,
                Comparator.reverseOrder()
        ));

        // 3) participantId → (rank, profitRate) 매핑 산정
        //    RANK 방식(1,2,2,4): 같은 pnl 이면 같은 순위, 다음 다른 값은 (인덱스+1) 부여
        Map<Long, ParticipantFinalResult> finalResultByParticipant = computeFinalResults(aggregates);

        // 4) 참가자 일괄 로드 (단일 SELECT) — N+1 방지
        List<Long> participantIds = aggregates.stream()
                .map(ContestParticipantSettlementAggregateDto::participantId)
                .toList();
        List<ContestParticipant> participants = contestParticipantRepository.findAllById(participantIds);

        // 5) dirty checking 으로 박제 — 트랜잭션 커밋 시 일괄 UPDATE 됨
        int finalizedCount = 0;
        for (ContestParticipant participant : participants) {
            ParticipantFinalResult result = finalResultByParticipant.get(participant.getId());
            if (result == null) {
                // 정상 흐름에선 도달 불가 — 동시에 참가자 삭제가 일어난 매우 드문 케이스 방어
                log.warn("[정산 집계] 참가자 매칭 누락 — seasonId={}, participantId={}",
                        seasonId, participant.getId());
                continue;
            }
            participant.markFinalResult(result.realizedPnl(), result.profitRate(), result.rank());
            finalizedCount++;
        }

        log.info("[정산 집계] 완료 — seasonId={}, finalizedParticipants={}", seasonId, finalizedCount);
        return finalizedCount;
    }

    // 정렬된 집계 리스트로부터 참가자별 (실현손익, 수익률, 순위) 산정.
    // RANK 방식: 동률이면 같은 순위 부여, 동률 다음 순위는 건너뜀.
    //   예) pnl [100, 80, 80, 60] → rank [1, 2, 2, 4]
    private Map<Long, ParticipantFinalResult> computeFinalResults(
            List<ContestParticipantSettlementAggregateDto> sortedAggregates
    ) {
        Map<Long, ParticipantFinalResult> result = new HashMap<>();

        BigDecimal previousPnl = null;
        int currentRank = 0;

        for (int i = 0; i < sortedAggregates.size(); i++) {
            ContestParticipantSettlementAggregateDto aggregate = sortedAggregates.get(i);

            // 이전 값과 다르면 새로운 순위 부여(인덱스 + 1) — RANK 방식의 핵심
            // 같으면 currentRank 유지 → 동률 처리
            if (previousPnl == null || aggregate.realizedPnlSum().compareTo(previousPnl) != 0) {
                currentRank = i + 1;
            }

            BigDecimal profitRate = calculateProfitRate(aggregate.realizedPnlSum(), aggregate.seedMoneySum());

            result.put(aggregate.participantId(), new ParticipantFinalResult(
                    aggregate.realizedPnlSum(),
                    profitRate,
                    currentRank
            ));

            previousPnl = aggregate.realizedPnlSum();
        }

        return result;
    }

    // 수익률 = (실현손익 / 시드머니) × 100. 시드머니 0 인 경계 케이스는 0%.
    // 음수 손익도 그대로 음수 수익률로 산출됨.
    private BigDecimal calculateProfitRate(BigDecimal realizedPnlSum, BigDecimal seedMoneySum) {
        if (seedMoneySum == null || seedMoneySum.compareTo(BigDecimal.ZERO) == 0) {
            // 시드머니가 0이거나 null인 경계 케이스 — divide 호출 시 ArithmeticException 방지
            return BigDecimal.ZERO.setScale(PROFIT_RATE_SCALE, RoundingMode.HALF_UP);
        }
        return realizedPnlSum
                .divide(seedMoneySum, PROFIT_RATE_SCALE, RoundingMode.HALF_UP)
                .multiply(PERCENT_MULTIPLIER)
                .setScale(PROFIT_RATE_SCALE, RoundingMode.HALF_UP);
    }

    // 산정 결과 운반체 — Map<participantId, ParticipantFinalResult> 형태로 즉시 lookup 하기 위해 사용
    private record ParticipantFinalResult(
            BigDecimal realizedPnl,
            BigDecimal profitRate,
            Integer rank
    ) {
    }
}
