package com.yogimangchi.domain.futures.dto.query;

import com.yogimangchi.domain.futures.entity.FuturesPosition;

// FuturesPositionService.openPosition() 반환 전용 전달 객체
// 신규 생성인지 추가 진입인지를 서비스 → OrderService 로 전달하기 위해 사용
public record FuturesPositionOpenResult(
        FuturesPosition position,
        boolean isNewPosition   // true: 신규 생성, false: 추가 진입(물타기)
) {}
