package com.yogimangchi.domain.real.dto.request;

import com.yogimangchi.domain.asset.enums.AssetType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@Schema(description = "자산 이체 요청 정보")
public record TransferRequestDto(
        
        @NotNull(message = "출금 지갑 타입은 필수입니다.")
        @Schema(description = "출금 지갑 타입 (예: TRADE_SPOT)", example = "TRADE_SPOT")
        AssetType fromType,

        @NotNull(message = "입금 지갑 타입은 필수입니다.")
        @Schema(description = "입금 지갑 타입 (예: TRADE_FUTURE)", example = "TRADE_FUTURE")
        AssetType toType,

        @NotNull(message = "이체 금액은 필수입니다.")
        @DecimalMin(value = "10.0", message = "최소 이체 금액은 10 달러 이상이어야 합니다.")
        @Schema(description = "이체 금액 (최소 10 달러 이상)", example = "10.00")
        BigDecimal amount,

        @NotBlank(message = "요청 ID(멱등성 키)는 필수입니다.")
        @Schema(description = "따닥 방지를 위한 프론트엔드 생성 고유 식별자 (UUID 등)", example = "123e4567-e89b-12d3-a456-426614174000")
        String requestId
) {
}
