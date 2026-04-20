package com.yogimangchi.domain.futures.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "청산 완료 포지션 내역 검색 조건")
public record FuturesClosedPositionSearchConditionDto(

        @Schema(description = "마지막으로 조회한 포지션 ID (처음 조회 시 생략, 이후에는 이전 응답의 nextCursorId 사용)", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "한 번에 가져올 개수 (기본값 10)", example = "10", defaultValue = "10")
        Integer size,

        @Schema(description = "특정 심볼만 조회", example = "BTCUSDT", nullable = true)
        String symbol
) {
    @Schema(hidden = true)
    public int getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : size;
    }
}
