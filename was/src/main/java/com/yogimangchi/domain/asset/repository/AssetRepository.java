package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssetRepository extends JpaRepository<Assets, Long> {

    Optional<Assets> findByMemberIdAndType(Long memberId, AssetType assetType);

    // 활성화된(ACTIVE) 특정 타입의 지갑이 있는지 확인하는 메서드 추가
    Optional<Assets> findByMemberIdAndTypeAndStatus(Long memberId, AssetType assetType, String status);

    // 가장 최근에 발급받은 지갑을 가져와서 재도전 횟수를 파악하는 메서드 추가
    Optional<Assets> findTopByMemberIdAndTypeOrderByRetryCountDesc(Long memberId, AssetType assetType);

}
