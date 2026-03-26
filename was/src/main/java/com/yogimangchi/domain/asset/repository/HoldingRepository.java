package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding, Long> {

    Optional<Holding> findByAssetsAndSymbol(Assets wallet, String symbol);

    List<Holding> findAllByAssets(Assets assets);
}
