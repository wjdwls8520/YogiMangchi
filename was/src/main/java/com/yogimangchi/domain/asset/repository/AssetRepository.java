package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AssetRepository extends JpaRepository<Assets, Long> {

    // 활성화된(ACTIVE) 특정 타입의 지갑이 있는지 확인하는 메서드
    Optional<Assets> findByMemberIdAndTypeAndStatus(Long memberId, AssetType assetType, String status);

    // 가장 최근에 발급받은 지갑을 가져와서 재도전 횟수를 파악하는 메서드
    Optional<Assets> findTopByMemberIdAndTypeOrderByRetryCountDesc(Long memberId, AssetType assetType);

    // 매매 동시성 제어를 위해 특정 지갑에 락을 걸고 가져오는 메서드
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Assets a WHERE a.member.id = :memberId AND a.type = :assetType AND a.status = :status")
    Optional<Assets> findByMemberIdAndTypeAndStatusForUpdate(
            @Param("memberId") Long memberId,
            @Param("assetType") AssetType assetType,
            @Param("status") String status
    );

    // 주문 취소/체결 정산 시 현금 자산을 안전하게 수정하기 위해 단건 락 조회를 둔다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Assets a WHERE a.id = :assetId")
    Optional<Assets> findByIdForUpdate(@Param("assetId") Long assetId);

}
