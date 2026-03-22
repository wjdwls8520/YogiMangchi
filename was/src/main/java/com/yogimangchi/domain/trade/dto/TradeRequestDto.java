package com.yogimangchi.domain.trade.dto;

import java.math.BigDecimal;

public class TradeRequestDto {

    public record OrderRequest(
        String symbol,
        String orderType,
        String side,
        BigDecimal price,
        BigDecimal quantity,
        BigDecimal totalAmount
    ){}
}
