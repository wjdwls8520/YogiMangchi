package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.asset.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 대회 시즌 정산 단계 — 지갑 일괄 비활성화 서비스
 *
 * 시즌 내 ACTIVE 상태인 대회 지갑들을 단일 SQL UPDATE 로 INACTIVE 전환한다.
 *
 * 정확성 보장
 *   - 동시성: 단일 SQL UPDATE 는 DB 레벨 원자성. 동시 호출 시 첫 번째만 행 변경 → 멱등
 *   - 정합성: WHERE status='ACTIVE' 가드로 이미 비활성인 지갑은 재변경 안 함
 *   - 데드락: assets 단일 테이블만 락. 기존 락 순서(지갑→포지션) 규칙과 무관
 *   - N+1: 단일 UPDATE 쿼리 — 시즌 내 N 개 지갑이라도 쿼리 1번
 *
 * 부수효과
 *   - 비활성화된 지갑의 PENDING 지정가 주문은 별도 취소 처리하지 않음
 *     (지정가 체결 트리거 쿼리가 status='ACTIVE' 조건을 보므로 절대 체결되지 않음)
 *   - 비활성화된 지갑의 OPEN 포지션은 다음 단계(포지션 일괄 청산)에서 처리
 *   - 코디네이터의 강제청산 쿼리도 status='ACTIVE' 조건을 사용하므로
 *     비활성화 후 해당 포지션이 코디네이터 조회에서 자동 제외됨
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestSettlementWalletDeactivator {

    private final AssetRepository assetRepository;

    /**
     * 시즌 내 ACTIVE 대회 지갑을 일괄 INACTIVE 처리.
     *
     * @param seasonId 정산 대상 시즌 ID
     * @return 실제로 ACTIVE → INACTIVE 로 전환된 지갑 수 (이미 INACTIVE 였던 지갑은 카운트 제외)
     */
    @Transactional
    public int deactivateForSeason(Long seasonId) {
        int affected = assetRepository.deactivateActiveContestWallets(seasonId, LocalDateTime.now());
        log.info("[정산 지갑 비활성화] seasonId={}, deactivated={}", seasonId, affected);
        return affected;
    }
}
