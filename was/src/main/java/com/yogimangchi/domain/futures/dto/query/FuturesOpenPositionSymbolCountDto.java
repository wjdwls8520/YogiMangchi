package com.yogimangchi.domain.futures.dto.query;

// 서버 기동 시 OPEN 포지션을 심볼별 일괄 카운트하기 위한 GROUP BY 결과 DTO
// 강제청산 Registry 복원용 (FuturesLiquidationBootstrapService 에서 사용)
public record FuturesOpenPositionSymbolCountDto(
        String symbol,
        Long count
) {}
