package com.yogimangchi.domain.futures.dto.request;

import com.yogimangchi.domain.futures.enums.PositionAction;
import com.yogimangchi.domain.futures.enums.PositionSide;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record FuturesMarketOrderRequestDto(

        @Schema(description = "거래할 선물 종목 심볼", example = "BTCUSDT")
        @NotBlank
        String symbol,

        @Schema(description = "포지션 방향 (LONG: 롱, SHORT: 숏)", example = "LONG")
        @NotNull
        PositionSide positionSide,

        @Schema(description = "포지션 동작 (OPEN: 진입, CLOSE: 청산)", example = "OPEN")
        @NotNull
        PositionAction positionAction,

        @Schema(description = "주문 수량", example = "0.01")
        @NotNull
        @DecimalMin(value = "0.00000001") //그보다 작은 값은 거절, 자동 반올림 없음, 소수점 자리수 제한 기능도 아님
        BigDecimal quantity
) {
}
