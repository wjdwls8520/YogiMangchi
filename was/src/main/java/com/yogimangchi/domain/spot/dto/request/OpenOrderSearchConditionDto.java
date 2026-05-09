package com.yogimangchi.domain.spot.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "미체결 주문 조회 조건")
public record OpenOrderSearchConditionDto(

        @Schema(description = "마지막으로 조회한 주문 ID(처음이면 비워두면 최신부터 조회)", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "한 번에 가져올 개수(기본값 10)", example = "10", defaultValue = "10")
        Integer size,

        @Schema(description = "특정 코인만 검색", example = "BTCUSDT", nullable = true)
        String symbol,

        @Schema(description = "매수(BUY)/매도(SELL) 필터", example = "BUY", nullable = true)
        String side
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : size;
    }
}
