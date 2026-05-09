package com.yogimangchi.domain.spot.dto.request;

import com.yogimangchi.domain.spot.enums.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Schema(description = "매매 체결 이력 검색 조건")
public record TradeHistorySearchCondition(

        @Schema(description = "마지막으로 조회한 체결 이력 ID(처음이면 비워두면 최신부터 조회)", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "한 번에 가져올 개수(기본값 10)", example = "10", defaultValue = "10")
        Integer size,

        @Schema(description = "특정 코인만 검색", example = "BTCUSDT", nullable = true)
        String symbol,

        @Schema(description = "매수(BUY)/매도(SELL) 필터", example = "BUY", nullable = true)
        String side,

        @Schema(description = "주문 상태 필터", example = "COMPLETED", nullable = true)
        OrderStatus status,

        @Schema(description = "조회 시작일", example = "2026-03-01", nullable = true)
        LocalDate startDate,

        @Schema(description = "조회 종료일", example = "2026-03-31", nullable = true)
        LocalDate endDate
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : size;
    }
}
