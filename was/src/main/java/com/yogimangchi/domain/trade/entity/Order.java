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
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "trade_order")
@Comment("사용자의 주문 원장 (주문 생성, 미체결, 체결 완료, 취소 상태 관리)")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    @Comment("주문이 속한 지갑 ID")
    private Assets assets;

    @Column(nullable = false, length = 20)
    @Comment("주문 코인 심볼 - 예: BTCUSDT")
    private String symbol;

    @Column(name = "order_type", nullable = false, length = 10)
    @Comment("주문 유형 (MARKET: 시장가, LIMIT: 지정가)")
    private String orderType;

    @Column(nullable = false, length = 10)
    @Comment("주문 방향 (BUY: 매수, SELL: 매도)")
    private String side;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 20)
    @Comment("주문 상태 (PENDING: 미체결, PARTIALLY_FILLED: 부분 체결, COMPLETED: 체결 완료, CANCELED: 취소)")
    private OrderStatus status;

    @Column(name = "order_price", precision = 19, scale = 8)
    @Comment("주문 가격(지정가 주문 시 사용, 시장가 주문은 null 가능)")
    private BigDecimal orderPrice;

    @Column(name = "order_quantity", precision = 19, scale = 8)
    @Comment("주문 수량 (매도/지정가 매수 시 기준 수량)")
    private BigDecimal orderQuantity;

    @Column(name = "order_amount", precision = 19, scale = 4)
    @Comment("주문 금액 (시장가 매수 시 사용자가 입력한 총 지출 예정 금액, 수수료 포함)")
    private BigDecimal orderAmount;

    @Column(name = "filled_quantity", nullable = false, precision = 19, scale = 8)
    @Comment("현재까지 누적 체결된 수량")
    private BigDecimal filledQuantity;

    @Column(name = "remaining_quantity", nullable = false, precision = 19, scale = 8)
    @Comment("아직 체결되지 않은 남은 수량")
    private BigDecimal remainingQuantity;

    @Column(name = "avg_filled_price", precision = 19, scale = 8)
    @Comment("누적 평균 체결가")
    private BigDecimal avgFilledPrice;

    @Column(name = "executed_amount", nullable = false, precision = 19, scale = 4)
    @Comment("누적 체결 원금 (수수료 제외)")
    private BigDecimal executedAmount;

    @Column(name = "total_fee", nullable = false, precision = 19, scale = 4)
    @Comment("누적 수수료")
    private BigDecimal totalFee;

    @Column(name = "executed_at")
    @Comment("주문의 최종 체결 완료 시각")
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

    // 시장가 매수 주문은 사용자가 입력한 총 지출 금액(수수료 포함) 기준으로 생성
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

    // 시장가 매도 주문은 주문 수량 기준으로 생성
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

    // 지정가 주문은 가격과 수량을 고정한 채 미체결 상태로 시작
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

    // 전량 체결 시 주문 상태와 누적 체결 원금/수수료 정보를 함께 갱신
    public void completeOrder(BigDecimal filledQuantity, BigDecimal avgFilledPrice,
                              BigDecimal executedAmount, BigDecimal totalFee, LocalDateTime executedAt) {
        this.status = OrderStatus.COMPLETED;
        this.filledQuantity = filledQuantity;
        this.remainingQuantity = BigDecimal.ZERO;
        this.avgFilledPrice = avgFilledPrice;
        this.executedAmount = executedAmount;
        this.totalFee = totalFee;
        this.executedAt = executedAt;
    }

    // 취소 시 주문 상태와 취소 시각을 기록
    public void cancelOrder(LocalDateTime canceledAt) {
        this.status = OrderStatus.CANCELED;
        this.canceledAt = canceledAt;
    }
}
