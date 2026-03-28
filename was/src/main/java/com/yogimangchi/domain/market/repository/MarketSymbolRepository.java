package com.yogimangchi.domain.market.repository;

import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.enums.MarketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MarketSymbolRepository extends JpaRepository<MarketSymbol, String> {

    // 전체조회
    List<MarketSymbol> findAllByIsActiveTrue();

    // 현물, 선물 특적 코인 + 공통 코인 조회
    @Query("SELECT m FROM MarketSymbol m WHERE m.isActive = true AND m.marketType IN (:type, 'BOTH')")
    List<MarketSymbol> findActiveSymbolsByType(@Param("type") MarketType type);

}
