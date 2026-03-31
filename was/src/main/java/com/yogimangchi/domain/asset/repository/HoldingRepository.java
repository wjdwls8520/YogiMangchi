package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HoldingRepository extends JpaRepository<Holding, Long> {

    Optional<Holding> findByAssetsAndSymbol(Assets wallet, String symbol);

    // 같은 코인이 두번 잠기지 않게 락
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM Holding h WHERE h.assets = :assets AND h.symbol = :symbol")
    Optional<Holding> findByAssetsAndSymbolForUpdate(
            @Param("assets") Assets assets,
            @Param("symbol") String symbol
    );

    List<Holding> findAllByAssets(Assets assets);
}
