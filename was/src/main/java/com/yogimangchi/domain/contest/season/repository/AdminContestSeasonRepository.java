package com.yogimangchi.domain.contest.season.repository;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;


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

    // 자동 정산 대상 시즌 조회 — 스케줄러가 주기적으로 호출
    //
    // 조회 조건
    //   - contestEndAt <= :now  : 종료 시각이 지난 시즌
    //   - settledAt IS NULL     : 아직 정산되지 않은 시즌 (멱등 가드 — 이미 정산된 시즌 재처리 방지)
    //   - isCancel = false      : 취소되지 않은 시즌 (취소된 대회는 별도 정책으로 처리)
    //
    // 정렬: id ASC — 오래된 시즌부터 우선 처리
    //
    // 반환량: 한 번에 여러 시즌이 종료돼 있을 수 있어 List 반환 (보통은 0~1건)
    @Query("""
            SELECT cs FROM ContestSeason cs
            WHERE cs.contestEndAt <= :now
              AND cs.settledAt IS NULL
              AND cs.isCancel = false
            ORDER BY cs.id ASC
            """)
    List<ContestSeason> findSeasonsToAutoSettle(@Param("now") LocalDateTime now);

    // 강제종료 정산 진입 시 contestEndAt 을 정산 시각으로 동기화
    //
    // 목적
    //   어드민이 contestEndAt 이전에 강제종료 버튼을 누른 케이스 대응. 거래 쿼리 가드
    //   (findTradableContestWalletForUpdate 의 cs.contestEndAt >= :now) 가 즉시 작동해
    //   Phase 2a 진행 중 신규 거래 진입을 자연 차단.
    //
    // WHERE 절 가드
    //   - cs.contestEndAt > :alignedAt : 이미 지난 시즌은 건드리지 않음
    //                                    스케줄러 트리거 케이스(contestEndAt 이미 과거)에선 영향 0
    //
    // 호출 빈도: 정산 1시도당 최대 1회 — 부담 없음
    //
    // 영속성 컨텍스트
    //   - clearAutomatically=true 로 1차 캐시 초기화 → 같은 트랜잭션 안에서 reload 시 최신 값 보장
    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE ContestSeason cs
            SET cs.contestEndAt = :alignedAt,
                cs.updatedAt = :alignedAt
            WHERE cs.id = :seasonId
              AND cs.contestEndAt > :alignedAt
            """)
    int alignContestEndAtBeforeSettlement(
            @Param("seasonId") Long seasonId,
            @Param("alignedAt") LocalDateTime alignedAt
    );
}
