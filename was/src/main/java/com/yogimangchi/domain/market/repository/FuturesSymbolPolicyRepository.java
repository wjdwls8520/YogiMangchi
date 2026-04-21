package com.yogimangchi.domain.market.repository;

import com.yogimangchi.domain.market.entity.FuturesSymbolPolicy;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FuturesSymbolPolicyRepository extends JpaRepository<FuturesSymbolPolicy, String> {

    @Query("SELECT f FROM FuturesSymbolPolicy f JOIN FETCH f.marketSymbol WHERE f.symbol = :symbol")
    Optional<FuturesSymbolPolicy> findWithMarketSymbolBySymbol(@Param("symbol") String symbol);

    // 선물 WebSocket 구독 대상 심볼 전체 조회
    @Query("SELECT f.symbol FROM FuturesSymbolPolicy f")
    List<String> findAllSymbols();
}
