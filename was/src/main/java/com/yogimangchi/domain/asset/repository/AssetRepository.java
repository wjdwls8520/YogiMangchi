package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetRepository extends JpaRepository<Assets, Long> {

    // 활성화된 특정 타입의 지갑 조회
    Optional<Assets> findByMemberIdAndTypeAndStatus(Long memberId, AssetType assetType, String status);

    // 가장 최근에 발급받은 지갑을 기준으로 재시도 횟수 확인
    Optional<Assets> findTopByMemberIdAndTypeOrderByRetryCountDesc(Long memberId, AssetType assetType);

    // 매매 동시성 제어를 위해 지갑에 락을 걸고 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Assets a WHERE a.member.id = :memberId AND a.type = :assetType AND a.status = :status")
    Optional<Assets> findByMemberIdAndTypeAndStatusForUpdate(
            @Param("memberId") Long memberId,
            @Param("assetType") AssetType assetType,
            @Param("status") String status
    );

    // 연관 객체(member)의 id를 명시적으로 타고 들어가는 활성 지갑 잠금 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Assets a WHERE a.member.id = :memberId AND a.type = :assetType AND a.status = :status")
    Optional<Assets> findByMember_IdAndTypeAndStatusForUpdate(
            @Param("memberId") Long memberId,
            @Param("assetType") AssetType assetType,
            @Param("status") String status
    );

    // 복수의 타입으로 사용자의 지갑 목록 조회 (해금 처리용)
    List<Assets> findAllByMemberIdAndTypeIn(Long memberId, List<AssetType> types);

    // 주문 취소/체결 정산 시 금액 일관성을 위해 지갑을 락 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Assets a WHERE a.id = :assetId")
    Optional<Assets> findByIdForUpdate(@Param("assetId") Long assetId);

    // 해당 시즌의 대회 지갑 보유 여부 확인
    boolean existsByMemberAndTypeAndContestSeason(Member participant, AssetType assetType, ContestSeason targetSeason);

    // 쓰기 작업 전 — 비관적 락으로 대회 지갑 조회 (시즌 진행 중 검증 포함)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT a
            FROM Assets a
            JOIN a.contestSeason cs
            WHERE a.member.id = :memberId
              AND a.type = :assetType
              AND a.status = :status
              AND cs.id = :contestSeasonId
              AND cs.isCancel = false
              AND cs.isPublic = true
              AND cs.contestStartAt <= :now
              AND cs.contestEndAt >= :now
            """)
    Optional<Assets> findTradableContestWalletForUpdate(
            @Param("memberId") Long memberId,
            @Param("assetType") AssetType assetType,
            @Param("status") String status,
            @Param("contestSeasonId") Long contestSeasonId,
            @Param("now") LocalDateTime now
    );

    // 읽기 전용 작업 — 락 없이 대회 지갑 조회 (시즌 진행 중 검증 포함)
    @Query("""
            SELECT a
            FROM Assets a
            JOIN a.contestSeason cs
            WHERE a.member.id = :memberId
              AND a.type = :assetType
              AND a.status = :status
              AND cs.id = :contestSeasonId
              AND cs.isCancel = false
              AND cs.isPublic = true
              AND cs.contestStartAt <= :now
              AND cs.contestEndAt >= :now
            """)
    Optional<Assets> findTradableContestWallet(
            @Param("memberId") Long memberId,
            @Param("assetType") AssetType assetType,
            @Param("status") String status,
            @Param("contestSeasonId") Long contestSeasonId,
            @Param("now") LocalDateTime now
    );

    // 정산 완료(또는 비활성화)된 대회 지갑 사후 조회용 — 락 없음, 상태/시각 필터 없음
    //
    // 용도
    //   대회가 끝나고 settledAt 이 박힌 후 사용자가 "정산 직후 내 지갑 상태"를 조회할 때.
    //   findTradableContestWallet 은 status='ACTIVE' AND contestEndAt >= now 가드 때문에
    //   정산 완료 시즌의 지갑(INACTIVE 또는 종료된 시즌)을 반환하지 않음 — 그 빈틈을 메움.
    //
    // 필터
    //   - (member, contestSeason, type=CONTEST) 만으로 고유 식별
    //   - status / isCancel / 시각 필터 없음 → 어떤 상태의 지갑이든 반환
    //   - 비참가자 호출 시 결과 없음 → 자연 인가
    //
    // 안전성
    //   - 락 없음 (읽기 전용)
    //   - 단순 SELECT — 데드락 / 부하 우려 없음
    @Query("""
            SELECT a
            FROM Assets a
            WHERE a.member.id = :memberId
              AND a.type = :assetType
              AND a.contestSeason.id = :contestSeasonId
            """)
    Optional<Assets> findContestWalletByMemberAndSeason(
            @Param("memberId") Long memberId,
            @Param("assetType") AssetType assetType,
            @Param("contestSeasonId") Long contestSeasonId
    );

    // 대회 지갑 정산 처리 — 시즌 내 ACTIVE 상태인 대회 지갑을 일괄 INACTIVE로 변경
    //
    // 정합성/멱등성 보장
    //   - WHERE 절의 status='ACTIVE' 조건으로 이미 비활성인 지갑은 변경 대상에서 제외
    //   - 재호출 시 영향 행 수 0 → 자연 멱등
    //
    // 정합성 (updatedAt 갱신)
    //   - bulk UPDATE 는 Hibernate @UpdateTimestamp 가 동작하지 않으므로 :now 로 명시 갱신
    //
    // 영속성 컨텍스트 처리
    //   - clearAutomatically=true 로 1차 캐시 클리어 — 같은 트랜잭션에서 이후 Assets 조회 시 stale 엔티티 방지
    //
    // 락/데드락
    //   - 단일 테이블(assets) 만 락 → 기존 락 순서 규칙(지갑→포지션) 영향 없음
    //   - 정산 시점은 contestEndAt 이후라 신규 거래로 인한 행 락 경합 없음
    //
    // @return 실제로 ACTIVE → INACTIVE 로 전환된 지갑 수
    @Modifying(clearAutomatically = true)
    @Query("""
            UPDATE Assets a
            SET a.status = 'INACTIVE',
                a.updatedAt = :now
            WHERE a.contestSeason.id = :contestSeasonId
              AND a.status = 'ACTIVE'
            """)
    int deactivateActiveContestWallets(
            @Param("contestSeasonId") Long contestSeasonId,
            @Param("now") LocalDateTime now
    );
}
