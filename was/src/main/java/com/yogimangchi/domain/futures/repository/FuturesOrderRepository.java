package com.yogimangchi.domain.futures.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.repository.query.FuturesOrderRepositoryCustom;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FuturesOrderRepository extends JpaRepository<FuturesOrder, Long>, FuturesOrderRepositoryCustom {

    // 지정가 체결/취소 시 — ID 기준 단건 조회 (비관적 락, 중복 처리 방지)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT fo FROM FuturesOrder fo WHERE fo.id = :orderId")
    Optional<FuturesOrder> findByIdForUpdate(@Param("orderId") Long orderId);

    // 지정가 CLOSE 이중등록 방지 / 강제청산 후 일괄취소 —
    // 특정 지갑·심볼·방향의 PENDING 상태 지정가 CLOSE 주문 전체 조회
    @Query("""
            SELECT fo FROM FuturesOrder fo
            WHERE fo.assets = :assets
              AND fo.symbol = :symbol
              AND fo.positionSide = :positionSide
              AND fo.positionAction = com.yogimangchi.domain.futures.enums.PositionStatus.CLOSE
              AND fo.orderType = com.yogimangchi.domain.futures.enums.OrderType.LIMIT
              AND fo.orderStatus = com.yogimangchi.domain.futures.enums.OrderStatus.PENDING
            """)
    List<FuturesOrder> findAllPendingLimitCloseOrders(
            @Param("assets") Assets assets,
            @Param("symbol") String symbol,
            @Param("positionSide") PositionSide positionSide
    );

    // 레버리지 변경 시 — 특정 방향의 PENDING LIMIT OPEN 주문 조회 (방향별 증거금 재계산용)
    @Query("""
            SELECT fo FROM FuturesOrder fo
            WHERE fo.assets = :assets
              AND fo.symbol = :symbol
              AND fo.positionSide = :positionSide
              AND fo.positionAction = com.yogimangchi.domain.futures.enums.PositionStatus.OPEN
              AND fo.orderType = com.yogimangchi.domain.futures.enums.OrderType.LIMIT
              AND fo.orderStatus = com.yogimangchi.domain.futures.enums.OrderStatus.PENDING
            """)
    List<FuturesOrder> findAllPendingLimitOpenOrders(
            @Param("assets") Assets assets,
            @Param("symbol") String symbol,
            @Param("positionSide") PositionSide positionSide
    );
}
