package com.yogimangchi.domain.trade.constant;

import java.math.BigDecimal;
import java.math.RoundingMode;

// 매매 수수료 정책 상수
public final class TradeFeePolicy {

    public static final BigDecimal MARKET_FEE_RATE = new BigDecimal("0.0005"); // 시장가 수수료율
    public static final BigDecimal LIMIT_FEE_RATE = new BigDecimal("0.0003");  // 지정가 수수료율

    private TradeFeePolicy() {
        // 인스턴스화 방지
    }

    // 체결 금액 기준 수수료 계산
    public static BigDecimal calculateFee(BigDecimal amount, BigDecimal feeRate) {
        return amount.multiply(feeRate).setScale(4, RoundingMode.HALF_UP);
    }

    // 지정가 매수 예약 금액 계산
    public static BigDecimal calculateReservationAmount(BigDecimal amount, BigDecimal feeRate) {
        return amount.add(calculateFee(amount, feeRate));
    }
}
