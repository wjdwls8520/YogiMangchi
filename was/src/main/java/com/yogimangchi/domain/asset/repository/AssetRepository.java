package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    // 주문 취소/체결 정산 시 금액 일관성을 위해 지갑을 락 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Assets a WHERE a.id = :assetId")
    Optional<Assets> findByIdForUpdate(@Param("assetId") Long assetId);








    // 해당 시즌의 대회 지갑 보유 여부 확인
    boolean existsByMemberAndTypeAndContestSeason(Member participant, AssetType assetType, ContestSeason targetSeason);

    // 현재 거래 가능한 대회 선물 지갑을 잠금 조회한다.
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
}
