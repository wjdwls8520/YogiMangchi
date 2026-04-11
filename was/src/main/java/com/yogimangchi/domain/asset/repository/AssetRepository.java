package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.LockModeType;
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

    // 주문 취소/체결 정산 시 금액 일관성을 위해 지갑을 락 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Assets a WHERE a.id = :assetId")
    Optional<Assets> findByIdForUpdate(@Param("assetId") Long assetId);

    // 해당 시즌의 대회 지갑 보유 여부 확인
    boolean existsByMemberAndTypeAndContestSeason(Member participant, AssetType assetType, ContestSeason targetSeason);
}
