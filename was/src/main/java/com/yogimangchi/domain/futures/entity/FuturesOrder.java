package com.yogimangchi.domain.futures.entity;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "futures_order")
public class FuturesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assets_id", nullable = false)
    @Comment("주문이 연결 될 지갑 ID (해당 지갑에서 대회인지. 어느대회시즌인지 까지 판별 가능")
    private Assets assets;

    @Column(nullable = false, length = 20)
    @Comment("주문 코인 심볼 - 예: BTCUSDT or BTCYD")
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 10)
    @Comment("주문 유형 (MARKET: 시장가, LIMIT: 지정가)")
    private OrderType orderType;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 20)
    @Comment("주문 상태 (PENDING: 미체결, PARTIALLY_FILLED: 부분 체결, COMPLETED: 체결 완료, CANCELED: 취소)")
    private OrderStatus orderStatus;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Comment("주문 포지션 방향 (LONG: 롱, SHORT: 숏)")
    private PositionSide positionSide;

    @Column(nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    @Comment("주문 포지션 행동 (OPEN: 포지션 시작, CLOSE: 포지션 종료)")
    private PositionStatus positionAction;


    // *** 코인 ***
    @Column(name = "order_price", precision = 19, scale = 8)
    @Comment("주문당시 선택한 [코인]의 가격 (시장가(market)는 null 체크)")
    private BigDecimal orderPrice; // 예) 5400불

    @Column(name = "order_quantity", nullable = false, precision = 19, scale = 8)
    @Comment("주문당시 선택한 [코인] 수량") // 예) 총 10개의 코인을 사야지
    private BigDecimal orderQuantity;

    @Column(name = "filled_quantity", precision = 19, scale = 8)
    @Comment("누적 체결된 [코인] 수량") // 예) 3개가 사졌네?
    private BigDecimal filledQuantity;

    @Column(name = "remaining_quantity", nullable = false, precision = 19, scale = 8)
    @Comment("체결되지 않은 남은 [코인] 수량") // 예) 그럼 체결안된게 7개 남았네
    private BigDecimal remainingQuantity;

    @Column(name = "avg_filled_price", precision = 19, scale = 8)
    @Comment("이 주문에서 체결된 [코인] 가격의 평균")
    private BigDecimal avgFilledPrice;


    // *** 돈, 금액, 수수료 ***
    @Column(name = "order_margin", precision = 19, scale = 8)
    @Comment("주문에 사용한 레버리지를 뺀 내 총 증거금(담보금) ((주문할 코인 가격 * 주문할 코인 수량)/레버리지 배수)") // 예) 레버리지를 뺸 내 원래 금액 즉, 이 주문에 묶인 내 담보금을 뜻함. ( price(가격) × quantity(수량) / 레버리지 )
    private BigDecimal orderMargin;

    @Column(name = "notional_amount", precision = 19, scale = 8)
    @Comment("주문에 사용한 레버리지를 포함한 포지션 총 명목금액 ( 주문할 코인 가격 * 주문할 코인 수량 )") // 예) 레버리지를 포함한 포지션 전체 가격 ( price(가격) × quantity(수량)인 )
    private BigDecimal notionalAmount;

    @Column(name = "executed_amount", nullable = false, precision = 19, scale = 8)
    @Comment("레버리지를 포함한 이 주문에서 체결된 누적 명목금액 (*레버리지가 포함되어 증거금보다 높을 수 있음*)") // 예) 레버리지를 포함한 포지션 전체 가격중 체결된 가격
    private BigDecimal executedAmount;

    @Column(name = "total_fee", precision = 19, scale = 4)
    @Comment("이 주문에서 누적된 총 누적 거래 수수료")
    private BigDecimal totalFee;


    // 체결 시각, 취소 시각, 생성 시각
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


    // *** 메서드팩토리 ***
    public static FuturesOrder orderMarketCreate(
            Assets assets,
            String symbol,
            OrderType orderType,
            OrderStatus orderStatus,
            PositionSide positionSide,
            PositionStatus positionAction,

            BigDecimal orderPrice,
            BigDecimal orderQuantity,
            BigDecimal filledQuantity,
            BigDecimal remainingQuantity,
            BigDecimal avgFilledPrice,

            BigDecimal orderMargin,
            BigDecimal notionalAmount,
            BigDecimal executedAmount,
            BigDecimal totalFee,

            LocalDateTime executedAt
    ) {
        FuturesOrder futuresOrder = new FuturesOrder();
        futuresOrder.assets = assets;
        futuresOrder.symbol = symbol;
        futuresOrder.orderType = orderType;
        futuresOrder.orderStatus = orderStatus;
        futuresOrder.positionSide = positionSide;
        futuresOrder.positionAction = positionAction;

        futuresOrder.orderPrice = orderPrice;
        futuresOrder.orderQuantity = orderQuantity;
        futuresOrder.remainingQuantity = remainingQuantity;
        futuresOrder.avgFilledPrice = avgFilledPrice;
        futuresOrder.filledQuantity = filledQuantity;

        futuresOrder.orderMargin = orderMargin;
        futuresOrder.notionalAmount = notionalAmount;
        futuresOrder.executedAmount = executedAmount;
        futuresOrder.totalFee = totalFee;

        futuresOrder.executedAt = executedAt;

        return futuresOrder;
    }

    // 지정가 주문 등록 — PENDING 상태로 생성, 체결 전이므로 filledQuantity/avgFilledPrice/executedAt 없음
    public static FuturesOrder orderLimitCreate(
            Assets assets,
            String symbol,
            PositionSide positionSide,
            PositionStatus positionAction,

            BigDecimal orderPrice,
            BigDecimal orderQuantity,

            BigDecimal orderMargin,
            BigDecimal notionalAmount,
            BigDecimal totalFee
    ) {
        FuturesOrder futuresOrder = new FuturesOrder();
        futuresOrder.assets = assets;
        futuresOrder.symbol = symbol;
        futuresOrder.orderType = OrderType.LIMIT;
        futuresOrder.orderStatus = OrderStatus.PENDING;
        futuresOrder.positionSide = positionSide;
        futuresOrder.positionAction = positionAction;

        futuresOrder.orderPrice = orderPrice;
        futuresOrder.orderQuantity = orderQuantity;
        futuresOrder.filledQuantity = BigDecimal.ZERO;
        futuresOrder.remainingQuantity = orderQuantity;
        futuresOrder.avgFilledPrice = null;

        futuresOrder.orderMargin = orderMargin;
        futuresOrder.notionalAmount = notionalAmount;
        futuresOrder.executedAmount = BigDecimal.ZERO;
        futuresOrder.totalFee = totalFee;

        futuresOrder.executedAt = null;
        return futuresOrder;
    }

    // 지정가 주문 체결 완료 — 지정가 = 체결가이므로 orderPrice 를 avgFilledPrice 로 사용
    public void fill(LocalDateTime filledAt) {
        this.orderStatus = OrderStatus.COMPLETED;
        this.filledQuantity = this.orderQuantity;
        this.remainingQuantity = BigDecimal.ZERO;
        this.avgFilledPrice = this.orderPrice;
        this.executedAmount = this.orderPrice.multiply(this.orderQuantity);
        this.executedAt = filledAt;
    }

    // 지정가 주문 취소 — 증거금/수수료 반환은 FuturesLimitOrderService 에서 처리
    public void cancel(LocalDateTime canceledAt) {
        this.orderStatus = OrderStatus.CANCELED;
        this.canceledAt = canceledAt;
    }

    public void updateOrderMargin(BigDecimal newOrderMargin) {
        this.orderMargin = newOrderMargin;
    }

}
