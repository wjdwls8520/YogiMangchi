package com.yogimangchi.domain.futures.dto.request;

import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

@Schema(description = "선물 주문 내역 검색 조건 — 체결/미체결 통합 조회")
public record FuturesOrderSearchConditionDto(

        @Schema(description = "마지막으로 조회한 주문 ID (처음 조회 시 생략, 이후에는 이전 응답의 nextCursorId 사용)", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "한 번에 가져올 개수 (기본값 10)", example = "10", defaultValue = "10")
        Integer size,

        @Schema(description = "특정 심볼만 조회", example = "BTCUSDT", nullable = true)
        String symbol,

        @Schema(description = "포지션 방향 필터 (LONG / SHORT)", example = "LONG", nullable = true)
        PositionSide positionSide,

        @Schema(description = "진입/청산 필터 (OPEN / CLOSE)", example = "OPEN", nullable = true)
        PositionStatus positionAction,

        @Schema(description = "주문 상태 필터 (PENDING / COMPLETED / CANCELED 등)", example = "COMPLETED", nullable = true)
        OrderStatus orderStatus,

        @Schema(description = "조회 시작일 (createdAt 기준)", example = "2026-01-01", nullable = true)
        LocalDate startDate,

        @Schema(description = "조회 종료일 (createdAt 기준)", example = "2026-12-31", nullable = true)
        LocalDate endDate
) {
    @Schema(hidden = true)
    public int getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : size;
    }
}
