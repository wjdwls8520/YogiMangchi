package com.yogimangchi.domain.futures.repository;

import com.yogimangchi.domain.futures.entity.FuturesOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FuturesOrderRepository extends JpaRepository<FuturesOrder, Long> {
}
