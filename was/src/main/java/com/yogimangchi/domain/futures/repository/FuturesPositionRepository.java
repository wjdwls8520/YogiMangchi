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

import org.springframework.data.domain.Pageable;

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

    // 포지션 조회 — 해당 지갑의 OPEN 포지션 전체 (락 없음, 읽기 전용)
    List<FuturesPosition> findAllByAssetsAndPositionStatus(Assets assets, PositionStatus positionStatus);

    // 포지션 조회 — 해당 지갑의 CLOSE 포지션 커서 방식 (락 없음, 선택적 심볼 필터)
    @Query("""
            SELECT fp
            FROM FuturesPosition fp
            WHERE fp.assets = :assets
              AND fp.positionStatus = :positionStatus
              AND (:symbol IS NULL OR fp.symbol = :symbol)
              AND (:cursorId IS NULL OR fp.id < :cursorId)
            ORDER BY fp.id DESC
            """)
    List<FuturesPosition> findClosedPositionsWithCursor(
            @Param("assets") Assets assets,
            @Param("positionStatus") PositionStatus positionStatus,
            @Param("symbol") String symbol,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );

    // 강제청산 부트스트랩 — 서버 재시작 시 OPEN 포지션이 존재하는 심볼 목록 복원
    @Query("SELECT DISTINCT fp.symbol FROM FuturesPosition fp WHERE fp.positionStatus = com.yogimangchi.domain.futures.enums.PositionStatus.OPEN")
    List<String> findDistinctOpenPositionSymbols();

    // 지갑 상태 조회 — 해당 지갑의 OPEN 포지션 증거금 합산 (사용 중인 마진 총액)
    @Query("SELECT COALESCE(SUM(fp.totalMargin), 0) FROM FuturesPosition fp WHERE fp.assets = :assets AND fp.positionStatus = :positionStatus")
    java.math.BigDecimal sumTotalMarginByAssetsAndPositionStatus(
            @Param("assets") Assets assets,
            @Param("positionStatus") PositionStatus positionStatus
    );
}
