package com.yogimangchi.domain.spot.repository;

import com.yogimangchi.domain.spot.entity.TradeHistory;
import org.springframework.data.jpa.repository.JpaRepository;

// TradeHistoryRepositoryCustom 상속 받아 사용
public interface TradeHistoryRepository extends JpaRepository<TradeHistory, Long>, TradeHistoryRepositoryCustom {

}
