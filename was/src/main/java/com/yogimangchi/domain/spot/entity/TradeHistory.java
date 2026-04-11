package com.yogimangchi.domain.spot.entity;

import com.yogimangchi.domain.asset.entity.Assets;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Comment("사용자 매매 기록")
public class TradeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    @Comment("거래가 발생한 지갑 ID")
    private Assets assets;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @Comment("체결 이력에 연결된 주문 ID")
    private Order order;

    @Column(nullable = false, length = 20)
    @Comment("거래 코인 심볼")
    private String symbol;

    @Column(name = "order_type", nullable = false, length = 10)
    @Comment("주문 타입")
    private String orderType;

    @Column(nullable = false, length = 10)
    @Comment("거래 방향")
    private String side;

    @Column(nullable = false, precision = 19, scale = 8)
    @Comment("체결 가격")
    private BigDecimal price;

    @Column(nullable = false, precision = 19, scale = 8)
    @Comment("체결 수량")
    private BigDecimal quantity;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    @Comment("체결 금액")
    private BigDecimal totalAmount;

    @Column(precision = 19, scale = 4)
    @Comment("발생 수수료")
    private BigDecimal fee;

    @Column(name = "realized_profit", precision = 19, scale = 4)
    @Comment("실현 손익")
    private BigDecimal realizedProfit;

    @Column(name = "executed_at")
    @Comment("실제 체결 시각")
    private LocalDateTime executedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("DB 기록 생성 시각")
    private LocalDateTime createdAt;

    @Builder
    protected TradeHistory(Assets assets, Order order, String symbol, String orderType, String side,
                           BigDecimal price, BigDecimal quantity, BigDecimal totalAmount,
                           BigDecimal fee, BigDecimal realizedProfit, LocalDateTime executedAt) {
        this.assets = assets;
        this.order = order;
        this.symbol = symbol;
        this.orderType = orderType;
        this.side = side;
        this.price = price;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.fee = fee;
        this.realizedProfit = realizedProfit;
        this.executedAt = executedAt;
    }

    // 시장가 매수 체결 이력 생성
    public static TradeHistory createMarketBuyHistory(Assets assets, Order order, String symbol,
                                                      BigDecimal price, BigDecimal quantity,
                                                      BigDecimal totalAmount, BigDecimal fee) {
        return TradeHistory.builder()
                .assets(assets)
                .order(order)
                .symbol(symbol)
                .orderType("MARKET")
                .side("BUY")
                .price(price)
                .quantity(quantity)
                .totalAmount(totalAmount)
                .fee(fee)
                .realizedProfit(BigDecimal.ZERO)
                .executedAt(LocalDateTime.now())
                .build();
    }

    // 시장가 매도 체결 이력 생성
    public static TradeHistory createMarketSellHistory(Assets assets, Order order, String symbol,
                                                       BigDecimal price, BigDecimal quantity,
                                                       BigDecimal totalAmount, BigDecimal fee,
                                                       BigDecimal realizedProfit) {
        return TradeHistory.builder()
                .assets(assets)
                .order(order)
                .symbol(symbol)
                .orderType("MARKET")
                .side("SELL")
                .price(price)
                .quantity(quantity)
                .totalAmount(totalAmount)
                .fee(fee)
                .realizedProfit(realizedProfit)
                .executedAt(LocalDateTime.now())
                .build();
    }

    // 지정가 매수 체결 이력 생성
    public static TradeHistory createLimitBuyHistory(Assets assets, Order order, String symbol,
                                                     BigDecimal price, BigDecimal quantity,
                                                     BigDecimal totalAmount, BigDecimal fee) {
        return TradeHistory.builder()
                .assets(assets)
                .order(order)
                .symbol(symbol)
                .orderType("LIMIT")
                .side("BUY")
                .price(price)
                .quantity(quantity)
                .totalAmount(totalAmount)
                .fee(fee)
                .realizedProfit(BigDecimal.ZERO)
                .executedAt(LocalDateTime.now())
                .build();
    }

    // 지정가 매도 체결 이력 생성
    public static TradeHistory createLimitSellHistory(Assets assets, Order order, String symbol,
                                                      BigDecimal price, BigDecimal quantity,
                                                      BigDecimal totalAmount, BigDecimal fee,
                                                      BigDecimal realizedProfit) {
        return TradeHistory.builder()
                .assets(assets)
                .order(order)
                .symbol(symbol)
                .orderType("LIMIT")
                .side("SELL")
                .price(price)
                .quantity(quantity)
                .totalAmount(totalAmount)
                .fee(fee)
                .realizedProfit(realizedProfit)
                .executedAt(LocalDateTime.now())
                .build();
    }
}
