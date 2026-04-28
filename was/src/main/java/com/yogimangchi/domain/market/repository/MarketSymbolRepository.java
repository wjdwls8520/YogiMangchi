package com.yogimangchi.domain.market.repository;

import com.yogimangchi.domain.market.dto.response.MarketSymbolResponseDto;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.enums.MarketType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface MarketSymbolRepository extends JpaRepository<MarketSymbol, String> {

    // 전체조회
    List<MarketSymbol> findAllByIsActiveTrue();

    // 현물
    @Query("SELECT m FROM MarketSymbol m WHERE m.isActive = true AND m.marketType IN (:type, 'BOTH')")
    List<MarketSymbol> findActiveSymbolsByType(@Param("type") MarketType type);

    // 선물
    @Query("""
        SELECT new com.yogimangchi.domain.market.dto.response.MarketSymbolResponseDto(
            fsp.symbol,
            ms.symbol,
            ms.displayNameKr,
            ms.displayNameEn,
            ms.baseAsset,
            ms.quoteAsset
        )
        FROM FuturesSymbolPolicy fsp
        JOIN fsp.marketSymbol ms
        WHERE ms.isActive = true AND ms.marketType = 'BOTH'
    """)
    List<MarketSymbolResponseDto> findActiveFuturesSymbolsByType();




}
