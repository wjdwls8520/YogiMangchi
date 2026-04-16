package com.yogimangchi.domain.futures.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesLeverageSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface FuturesLeverageSettingRepository extends JpaRepository<FuturesLeverageSetting, Long> {

    Optional<FuturesLeverageSetting> findByAssetsAndSymbol(Assets assets, String symbol);

    // ON CONFLICT () DO UPDATE  postgreSQL 문법, ON DUPLICATE KEY UPDATE MYSQL, mariaDB 문법
    @Modifying
    @Query(value = """
            INSERT INTO futures_leverage_setting (assets_id, symbol, leverage, created_at, updated_at)
            VALUES (:assetsId, :symbol, :leverage, now(), now())
            ON CONFLICT (assets_id, symbol) DO UPDATE
              SET leverage = EXCLUDED.leverage, updated_at = now()
            """, nativeQuery = true)
    void upsertLeverage(
            @Param("assetsId") Long assetsId,
            @Param("symbol") String symbol,
            @Param("leverage") int leverage
    );
}
