package com.yogimangchi.domain.trade.constant;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 매매 수수료 정책을 관리하는 상수 클래스
 * - 시장가(MARKET): 0.05%
 * - 지정가(LIMIT): 0.03%
 */
// 매매 수수료 정책
// 시장가(MARKET): 0.05% , 지정가(LIMIT): 0.03%
public final class TradeFeePolicy {

    public static final BigDecimal MARKET_FEE_RATE = new BigDecimal("0.0005"); // 0.05%
    public static final BigDecimal LIMIT_FEE_RATE = new BigDecimal("0.0003");  // 0.03%

    private TradeFeePolicy() {
        // 인스턴스 생성 방지
    }

    // 수수료 계산
    // amount  주문 금액 또는 매도 대금
    // feeRate 수수료율
    public static BigDecimal calculateFee(BigDecimal amount, BigDecimal feeRate) {
        return amount.multiply(feeRate).setScale(4, RoundingMode.HALF_UP);
    }
}
