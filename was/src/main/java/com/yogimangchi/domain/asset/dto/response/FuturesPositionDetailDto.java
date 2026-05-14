package com.yogimangchi.domain.asset.dto.response;

import com.yogimangchi.domain.futures.enums.PositionSide;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(name = "FuturesPositionDetailDto", description = "선물 포지션 실시간 상세 정보")
public record FuturesPositionDetailDto(
        @Schema(description = "심볼", example = "BTCUSDT") String symbol,
        @Schema(description = "포지션 방향", example = "LONG") PositionSide positionSide,
        @Schema(description = "레버리지", example = "10") int leverage,
        @Schema(description = "보유 수량", example = "0.5") BigDecimal quantity,
        @Schema(description = "평균 진입가", example = "50000.0000") BigDecimal entryPrice,
        @Schema(description = "현재가", example = "51000.0000") BigDecimal currentPrice,
        @Schema(description = "투입된 마진(증거금)", example = "2500.0000") BigDecimal margin,
        @Schema(description = "청산가", example = "45000.0000") BigDecimal liquidationPrice,
        @Schema(description = "미실현 손익", example = "500.0000") BigDecimal unrealizedPnl,
        @Schema(description = "수익률 (%)", example = "20.00") BigDecimal roi,
        @Schema(description = "시세 지연 여부", example = "false") boolean isPriceStale
) {}
