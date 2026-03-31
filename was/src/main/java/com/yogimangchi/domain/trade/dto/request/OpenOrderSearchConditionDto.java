package com.yogimangchi.domain.trade.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "미체결 주문 조회 조건")
public record OpenOrderSearchConditionDto(

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
        String side
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : size;
    }
}
