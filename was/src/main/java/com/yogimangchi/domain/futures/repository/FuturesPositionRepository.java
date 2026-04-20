package com.yogimangchi.domain.futures.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FuturesPositionRepository extends JpaRepository<FuturesPosition, Long> {

    // 주문 체결 시 — 특정 방향의 OPEN 포지션 단건 조회 (비관적 락)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT fp
            FROM FuturesPosition fp
            WHERE fp.assets = :assets
              AND fp.symbol = :symbol
              AND fp.positionSide = :positionSide
              AND fp.positionStatus = :positionStatus
            """)
    Optional<FuturesPosition> findByAssetsAndSymbolAndPositionSideWherePositionStatusForUpdate(
            @Param("assets") Assets wallet,
            @Param("symbol") String symbol,
            @Param("positionSide") PositionSide positionSide,
            @Param("positionStatus") PositionStatus positionStatus
    );

    // 레버리지 변경 시 — 해당 심볼의 모든 OPEN 포지션 조회 (롱+숏 동시 갱신, 비관적 락)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT fp
            FROM FuturesPosition fp
            WHERE fp.assets = :assets
              AND fp.symbol = :symbol
              AND fp.positionStatus = :positionStatus
            """)
    List<FuturesPosition> findAllByAssetsAndSymbolAndPositionStatusForUpdate(
            @Param("assets") Assets assets,
            @Param("symbol") String symbol,
            @Param("positionStatus") PositionStatus positionStatus
    );
}
