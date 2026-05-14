package com.yogimangchi.domain.contest.season.repository;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;


public interface AdminContestSeasonRepository extends JpaRepository<ContestSeason, Long>, AdminContestSeasonRepositoryCustom {

    // 정산 마킹 — CAS(Compare-And-Set) 방식으로 단일 UPDATE 원자성을 활용한 동시성 가드
    //
    // 사용 패턴
    //   영향 행 수 1 → 이번 호출이 진짜 첫 정산. 카운트 DTO 반환
    //   영향 행 수 0 → 다른 호출(또는 이전 호출)이 이미 마킹. alreadySettled DTO 반환
    //
    // 동시성/정합성
    //   - UPDATE ... WHERE settledAt IS NULL 의 DB 원자성으로 동시 호출 시 한 쪽만 성공
    //   - 비관적 락 불필요 — 단일 UPDATE 자체가 락 + 변경 + 해제를 일괄 수행
    //
    // 영속성 컨텍스트
    //   - clearAutomatically=true 로 1차 캐시 클리어 → 같은 트랜잭션에서 reload 시 최신 값 보장
    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE ContestSeason cs
            SET cs.settledAt = :settledAt,
                cs.updatedAt = :settledAt
            WHERE cs.id = :seasonId
              AND cs.settledAt IS NULL
            """)
    int markSettledIfNotYet(
            @Param("seasonId") Long seasonId,
            @Param("settledAt") LocalDateTime settledAt
    );
}
