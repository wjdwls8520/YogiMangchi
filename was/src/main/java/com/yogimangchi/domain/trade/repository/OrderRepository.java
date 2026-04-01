package com.yogimangchi.domain.trade.repository;

import com.yogimangchi.domain.trade.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, OrderRepositoryCustom {

    // 주문 취소/체결처럼 상태가 바뀌는 명령성 로직에서는 주문 행을 먼저 잠근다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM Order o
            JOIN o.assets a
            WHERE o.id = :orderId
              AND a.member.id = :memberId
            """)
    Optional<Order> findByIdAndMemberIdForUpdate(
            @Param("orderId") Long orderId,
            @Param("memberId") Long memberId
    );
}
