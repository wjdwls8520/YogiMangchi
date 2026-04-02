package com.yogimangchi.domain.trade.repository;

import com.yogimangchi.domain.trade.entity.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, OrderRepositoryCustom {

    // 회원 소유 주문 취소용 행 잠금 조회
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

    // 지정가 체결 실행용 행 잠금 조회
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT o
            FROM Order o
            JOIN FETCH o.assets
            WHERE o.id = :orderId
            """)
    Optional<Order> findByIdForExecution(@Param("orderId") Long orderId);
}
