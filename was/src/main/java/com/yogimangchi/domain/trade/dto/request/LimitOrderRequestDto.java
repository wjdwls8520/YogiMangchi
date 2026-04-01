package com.yogimangchi.domain.trade.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record LimitOrderRequestDto(

        @NotBlank(message = "코인 심볼은 필수입니다.")
        @Schema(description = "코인 심볼", example = "BTCUSDT")
        String symbol,

        @NotNull(message = "지갑 타입은 필수입니다.")
        @Schema(
                description = "매매를 진행할 지갑 타입(MOCK: 모의투자, TRADE_SPOT: 실전 현물, TRADE_FUTURE: 실전 선물, CONTEST: 대회)",
                example = "MOCK"
        )
        AssetType assetType,

        @NotBlank(message = "매매 방향은 필수입니다.")
        @Schema(description = "매매 방향 (BUY: 매수, SELL: 매도)", example = "BUY")
        String side,

        @NotNull(message = "주문 가격은 필수입니다.")
        @Positive(message = "주문 가격은 0보다 커야 합니다.")
        @Schema(description = "지정가 주문 가격", example = "70000")
        BigDecimal price,

        @NotNull(message = "주문 수량은 필수입니다.")
        @Positive(message = "주문 수량은 0보다 커야 합니다.")
        @Schema(description = "주문 수량", example = "0.5")
        BigDecimal quantity

) {
}
