package com.yogimangchi.domain.trade.repository;

import com.yogimangchi.domain.trade.entity.TradeHistory;
import org.springframework.data.jpa.repository.JpaRepository;

// TradeHistoryRepositoryCustom 상속 받아 사용
public interface TradeHistoryRepository extends JpaRepository<TradeHistory, Long>, TradeHistoryRepositoryCustom {

}
