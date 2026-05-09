package com.yogimangchi.domain.spot.repository;

import com.yogimangchi.domain.spot.entity.Order;
import com.yogimangchi.domain.spot.enums.OrderStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long>, OrderRepositoryCustom {

    // 회원 소유 주문 취소 시 잠금을 걸고 조회 (크로스 자산 공격 방어)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM Order o
            JOIN o.assets a
            WHERE o.id = :orderId
              AND a.member.id = :memberId
              AND a.type = :assetType
            """)
    Optional<Order> findByIdAndMemberIdAndAssetTypeForUpdate(
            @Param("orderId") Long orderId,
            @Param("memberId") Long memberId,
            @Param("assetType") com.yogimangchi.domain.asset.enums.AssetType assetType
    );

    // 지정가 주문 체결 실행 시 잠금을 걸고 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM Order o
            JOIN FETCH o.assets
            WHERE o.id = :orderId
            """)
    Optional<Order> findByIdForExecution(@Param("orderId") Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM Order o
            JOIN FETCH o.assets a
            WHERE a.id = :assetId
              AND o.orderType = 'LIMIT'
              AND o.status IN :statuses
            ORDER BY o.id ASC
            """)
    List<Order> findOpenLimitOrdersByAssetIdForUpdate(
            @Param("assetId") Long assetId,
            @Param("statuses") List<OrderStatus> statuses
    );
}
