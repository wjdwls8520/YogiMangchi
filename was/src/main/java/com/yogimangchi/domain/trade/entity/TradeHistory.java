package com.yogimangchi.domain.trade.entity;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.trade.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Comment("사용자의 매매기록")
public class TradeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    @Comment("거래가 발생한 지갑 ID")
    private Assets assets;

    @Column(nullable = false, length = 20)
    @Comment("거래한 코인 심볼")
    private String symbol;

    @Column(name = "order_type", nullable = false, length = 10)
    @Comment("주문 타입 (MARKET: 시장가, LIMIT: 지정가)")
    private String orderType;

    @Column(nullable = false, length = 10)
    @Comment("거래 방향 (BUY: 매수, SELL: 매도)")
    private String side;

    @Column(nullable = false, precision = 19, scale = 8)
    @Comment("1개당 체결 단가 (원화 기준)")
    private BigDecimal price;

    @Column(nullable = false, precision = 19, scale = 8)
    @Comment("체결된 코인 수량")
    private BigDecimal quantity;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    @Comment("총 거래 금액 (price * quantity)")
    private BigDecimal totalAmount;

    @Column(precision = 19, scale = 4)
    @Comment("발생한 수수료")
    private BigDecimal fee;

    @Column(name = "realized_profit", precision = 19, scale = 4)
    @Comment("실현 수익 (매도 시에만 기록, 매수 시에는 null 또는 0)")
    private BigDecimal realizedProfit;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false)
    @Comment("주문 상태 (PENDING: 미체결, COMPLETED: 체결완료, CANCELED: 취소)")
    private OrderStatus status;

    @Column(name = "executed_at", nullable = true)
    @Comment("실제 바이낸스/서버 기준 체결 시각 (미체결 시 null)")
    private LocalDateTime executedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("DB에 기록이 생성된 시각")
    private LocalDateTime createdAt;

    @Builder
    protected TradeHistory(Assets assets, String orderType, String symbol, String side,
                           BigDecimal price, BigDecimal quantity, BigDecimal totalAmount,
                           BigDecimal fee, BigDecimal realizedProfit, OrderStatus status, LocalDateTime executedAt) {
        this.assets = assets;
        this.orderType = orderType;
        this.symbol = symbol;
        this.side = side;
        this.price = price;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.fee = fee;
        this.realizedProfit = realizedProfit;
        this.status = status;
        this.executedAt = executedAt;
    }

    // 시장가 매수/매도
    public static TradeHistory createMarketBuyHistory(Assets assets, String symbol, BigDecimal price, BigDecimal quantity, BigDecimal totalAmount, BigDecimal fee) {
        return TradeHistory.builder()
                .assets(assets)
                .orderType("MARKET")  // 시장가 고정
                .symbol(symbol)
                .side("BUY")          // 매수 고정
                .price(price)
                .quantity(quantity)
                .totalAmount(totalAmount)
                .fee(fee)
                .realizedProfit(BigDecimal.ZERO) // 매수는 실현 수익 없음
                .status(OrderStatus.COMPLETED)   // 시장가는 즉시 체결완료
                .executedAt(LocalDateTime.now())
                .build();
    }

    public static TradeHistory createMarketSellHistory(Assets assets, String symbol, BigDecimal price, BigDecimal quantity, BigDecimal totalAmount, BigDecimal fee, BigDecimal realizedProfit) {
        return TradeHistory.builder()
                .assets(assets)
                .orderType("MARKET")  // 시장가 고정
                .symbol(symbol)
                .side("SELL")         // 매도 고정
                .price(price)
                .quantity(quantity)
                .totalAmount(totalAmount)
                .fee(fee)
                .realizedProfit(realizedProfit) // 매도시 실현 수익 로직
                .status(OrderStatus.COMPLETED)  // 시장가는 즉시 체결완료
                .executedAt(LocalDateTime.now())
                .build();
    }

}
