package com.yogimangchi.domain.trade.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.trade.enums.OrderStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Schema(description = "주문내역 검색 조건 / 무한 스크롤")
public record OrderSearchConditionDto(

        @Schema(description = "마지막으로 조회한 주문 ID (처음엔 비워두면 최신부터 조회)", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "한 번에 가져올 개수 (기본값 10)", example = "10", defaultValue = "10")
        Integer size,

        @NotNull(message = "지갑 타입은 필수입니다.")
        @Schema(description = "지갑 타입 (MOCK: 모의투자, TRADE_SPOT, TRADE_FUTURE, CONTEST: 대회)", example = "MOCK")
        AssetType assetType,

        @Schema(description = "특정 코인만 검색 (선택)", example = "BTCUSDT", nullable = true)
        String symbol,

        @Schema(description = "매수(BUY)/매도(SELL) 필터 (선택)", example = "BUY", nullable = true)
        String side,

        @Schema(description = "주문 상태 (PENDING / PARTIALLY_FILLED / COMPLETED / CANCELED) (선택)", example = "COMPLETED", nullable = true)
        OrderStatus status,

        @Schema(description = "조회 시작일 (선택)", example = "2026-03-01", nullable = true)
        LocalDate startDate,

        @Schema(description = "조회 종료일 (선택)", example = "2026-03-31", nullable = true)
        LocalDate endDate
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : size;
    }
}
