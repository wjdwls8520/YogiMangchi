package com.yogimangchi.domain.spot.dto.query;

// 회원 탈퇴 시 PENDING 지정가 주문을 심볼별 일괄 카운트하기 위한 GROUP BY 결과 DTO
public record SpotPendingSymbolCountDto(
        String symbol,
        Long count
) {}
