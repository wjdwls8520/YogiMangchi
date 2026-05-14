package com.yogimangchi.domain.asset.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

@Schema(name = "FuturesPortfolioDetailResponseDto", description = "선물 지갑 상태 및 포지션 목록")
public record FuturesPortfolioDetailResponseDto(
        @Schema(description = "주문 가능 현금 잔고", example = "5000.0000") BigDecimal cashBalance,
        @Schema(description = "잠긴 현금(지정가 주문 등)", example = "1000.0000") BigDecimal lockedMoney,
        @Schema(description = "총 현금 자산 (cashBalance + lockedMoney)", example = "6000.0000") BigDecimal totalCashAsset,
        @Schema(description = "사용 중인 총 마진(증거금)", example = "2500.0000") BigDecimal totalMargin,
        @Schema(description = "포지션 총 미실현 손익", example = "500.0000") BigDecimal totalUnrealizedPnl,
        @Schema(description = "선물 총 평가 자산 (totalCashAsset + totalMargin + totalUnrealizedPnl)", example = "9000.0000") BigDecimal totalAsset,
        @Schema(description = "포지션 목록") List<FuturesPositionDetailDto> positions
) {}