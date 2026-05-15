package com.yogimangchi.domain.contest.season.repository;

import com.yogimangchi.domain.contest.season.entity.ContestSettlementRun;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * settlement_run 감사 로그용 Repository
 *
 * <p>현재는 INSERT/UPDATE 만 사용. 어드민 조회 화면 추가 시 시즌별 이력 조회 메서드를 추후 확장.</p>
 */
public interface ContestSettlementRunRepository extends JpaRepository<ContestSettlementRun, Long> {
}
