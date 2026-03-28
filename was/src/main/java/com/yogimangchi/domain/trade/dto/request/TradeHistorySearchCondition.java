package com.yogimangchi.domain.trade.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Schema(description = "매매 영수증 검색 및 조건 필터 / 무한 스크롤")
public record TradeHistorySearchCondition(

        @Schema(description = "마지막으로 조회한 영수증 ID (처음엔 비워두면 최신부터 조회)", example = "NULL", nullable = true)
        Long cursorId,

        @Schema(description = "한 번에 가져올 개수 (기본값 20)", example = "10", defaultValue = "10")
        Integer size,

        @NotNull(message = "지갑 타입은 필수입니다.")
        @Schema(description = "지갑 타입 (MOCK, TRADE_SPOT, TRADE_FUTURE, CONTEST)", example = "MOCK")
        AssetType assetType,

        @Schema(description = "특정 코인만 검색 (선택)", example = "BTCUSDT", nullable = true)
        String symbol,

        @Schema(description = "매수(BUY)/매도(SELL) 필터 (선택)", example = "BUY", nullable = true)
        String side,

        @Schema(description = "조회 시작일 (선택)", example = "2026-03-01", nullable = true)
        LocalDate startDate,

        @Schema(description = "조회 종료일 (선택)", example = "2026-03-31", nullable = true)
        LocalDate endDate
) {
    // size가 null로 들어오면 기본값 10 세팅
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : size;
    }
}