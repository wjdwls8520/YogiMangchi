package com.yogimangchi.domain.real.dto.response;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

@Schema(description = "최대 이체 가능 금액 응답 DTO")
public record TransferableAmountResponseDto(
        @Schema(description = "지갑 타입", example = "TRADE_SPOT")
        AssetType assetType,

        @Schema(description = "총 잔고(가용+잠금)", example = "1000.0000")
        BigDecimal totalAmount,

        @Schema(description = "잠긴 금액(주문 대기 등)", example = "100.0000")
        BigDecimal lockedAmount,

        @Schema(description = "실제 이체 가능 금액(가용 잔고)", example = "900.0000")
        BigDecimal transferableAmount
) {
    public static TransferableAmountResponseDto from(Assets asset) {
        BigDecimal locked = asset.getLockedMoney() != null ? asset.getLockedMoney() : BigDecimal.ZERO;
        BigDecimal current = asset.getCurrentMoney() != null ? asset.getCurrentMoney() : BigDecimal.ZERO;
        BigDecimal total = current.add(locked);

        return new TransferableAmountResponseDto(
                asset.getType(),
                total,
                locked,
                current
        );
    }
}
