package com.yogimangchi.domain.real.dto.response;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.real.entity.TransferHistory;
import com.yogimangchi.domain.real.enums.TransferStatus;
import com.yogimangchi.domain.real.enums.TransferType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Schema(description = "이체 내역 응답 DTO")
public record TransferHistoryResponseDto(
        @Schema(description = "이체 내역 ID", example = "1")
        Long id,

        @Schema(description = "고유 요청 ID", example = "req_123456")
        String requestId,

        @Schema(description = "이체 유형", example = "SPOT_TO_FUTURE")
        TransferType transferType,

        @Schema(description = "출금 지갑 타입", example = "TRADE_SPOT")
        AssetType fromType,

        @Schema(description = "입금 지갑 타입", example = "TRADE_FUTURE")
        AssetType toType,

        @Schema(description = "이체 금액", example = "100.0000")
        BigDecimal amount,

        @Schema(description = "이체 후 출금 지갑 잔액", example = "900.0000")
        BigDecimal fromBalanceAfter,

        @Schema(description = "이체 후 입금 지갑 잔액", example = "1100.0000")
        BigDecimal toBalanceAfter,

        @Schema(description = "이체 수수료", example = "0.0000")
        BigDecimal feeAmount,

        @Schema(description = "이체 상태", example = "SUCCESS")
        TransferStatus status,

        @Schema(description = "이체 일시", example = "2026-05-06T12:00:00")
        LocalDateTime createdAt
) {
    public static TransferHistoryResponseDto from(TransferHistory history) {
        return new TransferHistoryResponseDto(
                history.getId(),
                history.getRequestId(),
                history.getTransferType(),
                history.getFromAsset().getType(),
                history.getToAsset().getType(),
                history.getAmount(),
                history.getFromBalanceAfter(),
                history.getToBalanceAfter(),
                BigDecimal.ZERO, // 요구사항에 따라 수수료는 0으로 고정
                history.getStatus(),
                history.getCreatedAt()
        );
    }
}
