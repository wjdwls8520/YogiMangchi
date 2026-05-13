package com.yogimangchi.domain.contest.season.repository;

import com.yogimangchi.domain.contest.season.entity.ContestSettlementPriceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 대회 시즌 정산용 가격 스냅샷 리포지토리
 *
 *  Phase 1 (캡처):
 *   - existsByContestSeason_IdAndSymbol(...) 으로 멱등 체크 후 save
 *
 *  Phase 2 (정산):
 *   - findAllByContestSeason_Id(...) 으로 시즌의 모든 스냅샷을 한 번에 로드해
 *     심볼 → 가격 맵을 구성, 포지션 청산 시 lookup 으로 사용
 */
public interface ContestSettlementPriceSnapshotRepository
        extends JpaRepository<ContestSettlementPriceSnapshot, Long> {

    // 멱등 캡처용 — 이미 같은 (시즌, 심볼) 스냅샷이 있으면 다시 만들지 않음
    boolean existsByContestSeason_IdAndSymbol(Long contestSeasonId, String symbol);

    // 정산 실행 시 일괄 로드용 — 한 시즌의 모든 심볼 스냅샷을 메모리에 올림
    List<ContestSettlementPriceSnapshot> findAllByContestSeason_Id(Long contestSeasonId);
}
