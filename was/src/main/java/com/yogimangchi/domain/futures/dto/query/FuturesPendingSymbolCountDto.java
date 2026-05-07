package com.yogimangchi.domain.futures.dto.query;

// 서버 기동 시 PENDING 지정가 주문을 심볼별 일괄 카운트하기 위한 GROUP BY 결과 DTO
public record FuturesPendingSymbolCountDto(
        String symbol,
        Long count
) {}
