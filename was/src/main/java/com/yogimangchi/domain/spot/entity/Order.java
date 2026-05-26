package com.yogimangchi.domain.spot.entity;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.spot.enums.OrderStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "trade_order")
@Comment("사용자 주문 원장")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    @Comment("주문이 속한 지갑 ID")
    private Assets assets;

    @Column(nullable = false, length = 20)
    @Comment("주문 코인 심볼")
    private String symbol;

    @Column(name = "order_type", nullable = false, length = 10)
    @Comment("주문 유형(MARKET, LIMIT)")
    private String orderType;

    @Column(nullable = false, length = 10)
    @Comment("주문 방향(BUY, SELL)")
    private String side;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 20)
    @Comment("주문 상태(PENDING, PARTIALLY_FILLED, COMPLETED, CANCELED)")
    private OrderStatus status;

    @Column(name = "order_price", precision = 19, scale = 8)
    @Comment("주문 가격")
    private BigDecimal orderPrice;

    @Column(name = "order_quantity", precision = 19, scale = 8)
    @Comment("주문 수량")
    private BigDecimal orderQuantity;

    @Column(name = "order_amount", precision = 19, scale = 8)
    @Comment("주문 금액")
    private BigDecimal orderAmount;

    @Column(name = "filled_quantity", nullable = false, precision = 19, scale = 8)
    @Comment("누적 체결 수량")
    private BigDecimal filledQuantity;

    @Column(name = "remaining_quantity", nullable = false, precision = 19, scale = 8)
    @Comment("남은 수량")
    private BigDecimal remainingQuantity;

    @Column(name = "avg_filled_price", precision = 19, scale = 8)
    @Comment("평균 체결가")
    private BigDecimal avgFilledPrice;

    @Column(name = "executed_amount", nullable = false, precision = 19, scale = 4)
    @Comment("누적 체결 금액")
    private BigDecimal executedAmount;

    @Column(name = "total_fee", nullable = false, precision = 19, scale = 4)
    @Comment("누적 수수료")
    private BigDecimal totalFee;

    @Column(name = "executed_at")
    @Comment("최종 체결 시각")
    private LocalDateTime executedAt;

    @Column(name = "canceled_at")
    @Comment("주문 취소 시각")
    private LocalDateTime canceledAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("주문 생성 시각")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Comment("주문 최종 수정 시각")
    private LocalDateTime updatedAt;

    @Builder
    protected Order(Assets assets, String symbol, String orderType, String side, OrderStatus status,
                    BigDecimal orderPrice, BigDecimal orderQuantity, BigDecimal orderAmount,
                    BigDecimal filledQuantity, BigDecimal remainingQuantity, BigDecimal avgFilledPrice,
                    BigDecimal executedAmount, BigDecimal totalFee, LocalDateTime executedAt,
                    LocalDateTime canceledAt) {
        this.assets = assets;
        this.symbol = symbol;
        this.orderType = orderType;
        this.side = side;
        this.status = status;
        this.orderPrice = orderPrice;
        this.orderQuantity = orderQuantity;
        this.orderAmount = orderAmount;
        this.filledQuantity = filledQuantity;
        this.remainingQuantity = remainingQuantity;
        this.avgFilledPrice = avgFilledPrice;
        this.executedAmount = executedAmount;
        this.totalFee = totalFee;
        this.executedAt = executedAt;
        this.canceledAt = canceledAt;
    }

    // 시장가 매수 주문 생성
    public static Order createMarketBuyOrder(Assets assets, String symbol, BigDecimal orderAmount) {
        return Order.builder()
                .assets(assets)
                .symbol(symbol)
                .orderType("MARKET")
                .side("BUY")
                .status(OrderStatus.PENDING)
                .orderPrice(null)
                .orderQuantity(null)
                .orderAmount(orderAmount)
                .filledQuantity(BigDecimal.ZERO)
                .remainingQuantity(BigDecimal.ZERO)
                .avgFilledPrice(null)
                .executedAmount(BigDecimal.ZERO)
                .totalFee(BigDecimal.ZERO)
                .build();
    }

    // 시장가 매도 주문 생성
    public static Order createMarketSellOrder(Assets assets, String symbol, BigDecimal orderQuantity) {
        return Order.builder()
                .assets(assets)
                .symbol(symbol)
                .orderType("MARKET")
                .side("SELL")
                .status(OrderStatus.PENDING)
                .orderPrice(null)
                .orderQuantity(orderQuantity)
                .orderAmount(null)
                .filledQuantity(BigDecimal.ZERO)
                .remainingQuantity(orderQuantity)
                .avgFilledPrice(null)
                .executedAmount(BigDecimal.ZERO)
                .totalFee(BigDecimal.ZERO)
                .build();
    }

    // 지정가 주문 생성
    public static Order createLimitOrder(Assets assets, String symbol, String side,
                                         BigDecimal orderPrice, BigDecimal orderQuantity) {
        BigDecimal orderAmount = orderPrice.multiply(orderQuantity).setScale(4, RoundingMode.HALF_UP);

        return Order.builder()
                .assets(assets)
                .symbol(symbol)
                .orderType("LIMIT")
                .side(side)
                .status(OrderStatus.PENDING)
                .orderPrice(orderPrice)
                .orderQuantity(orderQuantity)
                .orderAmount(orderAmount)
                .filledQuantity(BigDecimal.ZERO)
                .remainingQuantity(orderQuantity)
                .avgFilledPrice(null)
                .executedAmount(BigDecimal.ZERO)
                .totalFee(BigDecimal.ZERO)
                .build();
    }

    // 주문을 전량 체결 상태로 갱신
    public void completeOrder(BigDecimal filledQuantity, BigDecimal avgFilledPrice,
                              BigDecimal executedAmount, BigDecimal totalFee, LocalDateTime executedAt) {
        this.status = OrderStatus.COMPLETED;
        this.filledQuantity = filledQuantity;
        this.remainingQuantity = BigDecimal.ZERO;
        this.avgFilledPrice = avgFilledPrice;
        this.executedAmount = executedAmount;
        this.totalFee = totalFee;
        this.executedAt = executedAt;

        if (this.orderQuantity == null) {
            // 시장가 매수(BUY): 체결된 수량이 곧 원래 주문하고자 했던 수량과 같음
            this.orderQuantity = filledQuantity;
        }

        if (this.orderAmount == null) {
            // 시장가 매도(SELL): 체결된 금액(수수료 차감 전 원금)이 곧 주문 금액이 됨
            this.orderAmount = executedAmount;
        }
    }

    // 주문 취소 상태 반영
    public void cancelOrder(LocalDateTime canceledAt) {
        this.status = OrderStatus.CANCELED;
        this.canceledAt = canceledAt;
    }
}
