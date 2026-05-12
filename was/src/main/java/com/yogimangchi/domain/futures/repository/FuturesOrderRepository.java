package com.yogimangchi.domain.futures.repository;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.repository.query.FuturesOrderRepositoryCustom;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    // 강제청산/시장가청산/지정가청산 후 일괄 취소 — 특정 지갑/심볼/방향의 PENDING LIMIT CLOSE 전체를 단일 UPDATE 로 처리
    // 루프 기반 .cancel() 호출과 비교해 (1) 영속성 컨텍스트 로드 비용 제거 (2) 이벤트 단일 발행 (3) 락 점유 시간 최소화
    // flushAutomatically=true : 호출 전 영속성 컨텍스트의 변경사항을 먼저 DB에 반영하여 UPDATE 결과 정합성 확보
    // clearAutomatically=true : UPDATE 후 영속성 컨텍스트의 stale 엔티티 제거 (후속 로직에서 옛 상태로 동작하는 것 방지)
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE FuturesOrder fo
               SET fo.orderStatus = com.yogimangchi.domain.futures.enums.OrderStatus.CANCELED,
                   fo.canceledAt = :canceledAt
             WHERE fo.assets = :assets
               AND fo.symbol = :symbol
               AND fo.positionSide = :positionSide
               AND fo.positionAction = com.yogimangchi.domain.futures.enums.PositionStatus.CLOSE
               AND fo.orderType = com.yogimangchi.domain.futures.enums.OrderType.LIMIT
               AND fo.orderStatus = com.yogimangchi.domain.futures.enums.OrderStatus.PENDING
            """)
    int bulkCancelAllPendingCloseOrders(
            @Param("assets") Assets assets,
            @Param("symbol") String symbol,
            @Param("positionSide") PositionSide positionSide,
            @Param("canceledAt") LocalDateTime canceledAt
    );

    // 부분청산 후 오버플로우 만큼 취소 — 호출 측에서 선별한 ID 리스트를 단일 UPDATE 로 일괄 취소
    // WHERE 절에 PENDING 조건을 포함하여 동시 체결로 이미 상태가 바뀐 주문은 자연 스킵
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE FuturesOrder fo
               SET fo.orderStatus = com.yogimangchi.domain.futures.enums.OrderStatus.CANCELED,
                   fo.canceledAt = :canceledAt
             WHERE fo.id IN :ids
               AND fo.orderStatus = com.yogimangchi.domain.futures.enums.OrderStatus.PENDING
            """)
    int bulkCancelByIds(
            @Param("ids") List<Long> ids,
            @Param("canceledAt") LocalDateTime canceledAt
    );
}
