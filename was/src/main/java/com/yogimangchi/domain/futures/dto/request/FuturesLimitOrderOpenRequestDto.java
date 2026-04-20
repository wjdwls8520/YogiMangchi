package com.yogimangchi.domain.futures.dto.request;

import com.yogimangchi.domain.futures.enums.PositionSide;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record FuturesLimitOrderOpenRequestDto(

        @Schema(description = "거래할 선물 종목 심볼", example = "BTCUSDT")
        @NotBlank
        String symbol,

        @Schema(description = "포지션 방향 (LONG: 롱, SHORT: 숏)", example = "LONG")
        @NotNull
        PositionSide positionSide,

        @Schema(description = "지정가 주문 가격", example = "54000.12")
        @NotNull
        @DecimalMin(value = "0.00000001")
        BigDecimal orderPrice,

        @Schema(description = "주문 수량", example = "0.01")
        @NotNull
        @DecimalMin(value = "0.00000001")
        BigDecimal orderQuantity
) {
}

