package com.yogimangchi.domain.futures.dto.response;

import com.yogimangchi.domain.asset.entity.Assets;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ContestFuturesWalletStatusResponseDto(
        Long walletId,
        BigDecimal seedMoney,
        BigDecimal currentMoney,
        BigDecimal marginInUse,
        String status,
        LocalDateTime expiredAt,
        int retryCount
) {
    public static ContestFuturesWalletStatusResponseDto of(Assets wallet, BigDecimal marginInUse) {
        return new ContestFuturesWalletStatusResponseDto(
                wallet.getId(),
                wallet.getSeedMoney(),
                wallet.getCurrentMoney(),
                marginInUse,
                wallet.getStatus(),
                wallet.getExpiredAt(),
                wallet.getRetryCount()
        );
    }
}
