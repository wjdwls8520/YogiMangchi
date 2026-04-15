package com.yogimangchi.domain.futures.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesLeverageSetting;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FuturesLeverageSettingRepository extends JpaRepository<FuturesLeverageSetting, Long> {

    Optional<FuturesLeverageSetting> findByAssetsAndSymbol(Assets assets, String symbol);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM FuturesLeverageSetting f WHERE f.assets = :assets AND f.symbol = :symbol")
    Optional<FuturesLeverageSetting> findByAssetsAndSymbolForUpdate(
            @Param("assets") Assets assets,
            @Param("symbol") String symbol
    );
}
