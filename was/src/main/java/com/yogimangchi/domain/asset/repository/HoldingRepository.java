package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HoldingRepository extends JpaRepository<Holding, Long> {

    Optional<Holding> findByAssetsAndSymbol(Assets wallet, String symbol);

    // 동일 코인에 대한 중복 갱신을 막기 위해 락 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM Holding h WHERE h.assets = :assets AND h.symbol = :symbol")
    Optional<Holding> findByAssetsAndSymbolForUpdate(
            @Param("assets") Assets assets,
            @Param("symbol") String symbol
    );

    List<Holding> findAllByAssets(Assets assets);
}
