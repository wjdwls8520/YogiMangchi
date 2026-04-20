package com.yogimangchi.domain.futures.repository;

import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.repository.query.FuturesOrderRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FuturesOrderRepository extends JpaRepository<FuturesOrder, Long>, FuturesOrderRepositoryCustom {
}
