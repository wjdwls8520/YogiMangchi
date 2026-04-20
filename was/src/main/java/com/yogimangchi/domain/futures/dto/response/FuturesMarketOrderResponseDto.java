package com.yogimangchi.domain.futures.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "선물 시장가 주문 체결 응답")
public record FuturesMarketOrderResponseDto(

        @Schema(description = "체결된 주문 정보")
        FuturesOrderResultDto order,

        @Schema(description = "체결 이후 포지션 현재 상태 (신규 생성 또는 추가 진입/청산 후 상태)")
        FuturesPositionResultDto position
) {}
