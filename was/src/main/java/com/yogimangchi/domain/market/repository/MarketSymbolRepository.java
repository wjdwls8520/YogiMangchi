package com.yogimangchi.domain.market.repository;

import com.yogimangchi.domain.market.entity.MarketSymbol;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketSymbolRepository extends JpaRepository<MarketSymbol, String> {
    List<MarketSymbol> findAllByIsActiveTrue();
}
