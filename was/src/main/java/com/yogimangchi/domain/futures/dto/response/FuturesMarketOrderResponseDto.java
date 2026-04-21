package com.yogimangchi.domain.futures.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "선물 시장가 주문 체결 응답")
public record FuturesMarketOrderResponseDto(

        @Schema(description = "체결된 주문 정보")
        FuturesOrderResultDto order,

        @Schema(description = "체결 이후 포지션 현재 상태 (부분 청산 후 잔여 포지션, 완전 청산 시 null)", nullable = true)
        FuturesPositionResultDto position,

        @Schema(description = "이번 청산에서 발생한 실현 손익 (진입 주문이면 null)", example = "50.00", nullable = true)
        BigDecimal thisCloseRealizedPnl
) {}
