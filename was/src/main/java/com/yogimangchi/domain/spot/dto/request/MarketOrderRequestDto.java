package com.yogimangchi.domain.spot.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record MarketOrderRequestDto(

        @NotBlank(message = "코인 심볼은 필수입니다.")
        @Schema(description = "코인 심볼", example = "BTCUSDT")
        String symbol,

        @NotNull(message = "지갑 타입은 필수입니다.")
        @Schema(
                description = "매매를 진행할 지갑 타입. MOCK: 모의투자, TRADE_SPOT: 실전 현물, TRADE_FUTURE: 실전 선물, CONTEST: 대회",
                example = "MOCK"
        )
        AssetType assetType,

        @NotNull(message = "매매 방향은 필수입니다.")
        @Schema(description = "매매 방향 (BUY: 매수, SELL: 매도)", example = "BUY")
        String side,

        @Positive(message = "매도 수량은 0보다 커야 합니다.")
        @Schema(description = "매도(SELL) 시 매도할 코인 수량", example = "0.5")
        BigDecimal quantity,

        @Positive(message = "매수 금액은 0보다 커야 합니다.")
        @Schema(description = "매수(BUY) 시 사용할 총 지출 금액(수수료 포함)", example = "1000")
        BigDecimal totalAmount

) {
    // 프론트엔드의 파라미터 변조를 방지하기 위해 Controller 계층에서 호출하여 AssetType을 안전하게 덮어씌우는 헬퍼 메서드입니다.
    public MarketOrderRequestDto withAssetType(AssetType assetType) {
        return new MarketOrderRequestDto(this.symbol, assetType, this.side, this.quantity, this.totalAmount);
    }
}
