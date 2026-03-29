package com.yogimangchi.domain.trade.repository;

import com.yogimangchi.domain.trade.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
