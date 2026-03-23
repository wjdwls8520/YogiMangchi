package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AssetRepository extends JpaRepository<Assets, Long> {

    Optional<Assets> findByMemberIdAndType(Long memberId, AssetType assetType);
}
