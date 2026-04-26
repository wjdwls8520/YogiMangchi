package com.yogimangchi.domain.futures.entity;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
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
@Table(name = "futures_position")
public class FuturesPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Comment("포지션 고유 식별자 (PK)")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assets_id", nullable = false)
    @Comment("어느 지갑의 포지션인지 (FK) - 대회 시즌 판별 가능")
    private Assets assets;

    @Column(nullable = false, length = 20)
    @Comment("주문 코인 심볼 (예: BTCUSDT, BTCYD)")
    private String symbol;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Comment("포지션 방향 (LONG: 매수, SHORT: 매도)")
    private PositionSide positionSide;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Comment("포지션 상태 (OPEN: 유지 중, CLOSED: 청산 완료)")
    private PositionStatus positionStatus;



    @Column(precision = 19, scale = 8, nullable = false)
    @Comment("현재 보유 수량 (추가 진입 시 증가, 청산 시 감소)")
    private BigDecimal filledQuantity;

    @Column(precision = 19, scale = 8, nullable = false)
    @Comment("평균 진입가 (추가 진입 시 물타기 방식으로 재계산)")
    private BigDecimal entryPrice;

    @Column(precision = 19, scale = 8, nullable = false)
    @Comment("포지션에 투입된 총 증거금 합계")
    private BigDecimal totalMargin;

    @Column(nullable = false)
    @Comment("적용된 레버리지 배수")
    private int leverage;

    @Column(name = "notional_amount", precision = 19, scale = 8)
    @Comment("포지션에 투입된 레버리지를 포함한 총 명목금액 ( totalMargin * 레버리지 )") // 예) 레버리지를 포함한 포지션 전체 가격
    private BigDecimal notionalAmount;

    @Column(precision = 19, scale = 8)
    @Comment("강제 청산 가격")
    private BigDecimal liquidationPrice; // LONG  청산가 = entryPrice × (1 - 1/leverage), SHORT 청산가 = entryPrice × (1 + 1/leverage)

    @Column(precision = 19, scale = 8)
    @Comment("부분 청산 시 발생한 누적 실현 손익")
    private BigDecimal realizedPnl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("최초 포지션 진입 시각")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Comment("마지막 포지션 변경 시각")
    private LocalDateTime updatedAt;



    // 팩토리 메서드 영역

    // 포지션 생성(오픈) 메서드
    public static FuturesPosition open(
            Assets assets,
            String symbol,
            PositionSide positionSide,
            BigDecimal quantity,
            BigDecimal entryPrice,
            int leverage,
            BigDecimal totalMargin,
            BigDecimal notionalAmount
    ) {
        FuturesPosition position = new FuturesPosition();
        position.assets = assets;
        position.symbol = symbol;
        position.positionSide = positionSide;
        position.positionStatus = PositionStatus.OPEN;
        position.filledQuantity = quantity;
        position.entryPrice = entryPrice;
        position.leverage = leverage;
        position.totalMargin = totalMargin;
        position.notionalAmount = notionalAmount;
        position.liquidationPrice = calculateLiquidationPrice(positionSide, entryPrice, leverage);
        position.realizedPnl = BigDecimal.ZERO;
        return position;
    }

    // 강제청산 수수료율 (taker fee 0.05%) — 청산가에 미리 반영하여 청산 실행 시 별도 계산 불필요
    private static final BigDecimal LIQUIDATION_FEE_RATE = new BigDecimal("0.0005");

    private static BigDecimal calculateLiquidationPrice(PositionSide positionSide, BigDecimal entryPrice, int leverage) {
        BigDecimal leverageDecimal = BigDecimal.valueOf(leverage);
        BigDecimal inverseL = BigDecimal.ONE.divide(leverageDecimal, 8, RoundingMode.HALF_UP);
        if (positionSide == PositionSide.LONG) {
            // LONG 청산가 = entryPrice × (1 - 1/leverage + 수수료율)
            // 수수료만큼 청산가가 높아져 더 일찍 청산됨 → 증거금 부족 방어
            return entryPrice.multiply(BigDecimal.ONE.subtract(inverseL).add(LIQUIDATION_FEE_RATE)).setScale(8, RoundingMode.HALF_UP);
        } else {
            // SHORT 청산가 = entryPrice × (1 + 1/leverage - 수수료율)
            // 수수료만큼 청산가가 낮아져 더 일찍 청산됨 → 증거금 부족 방어
            return entryPrice.multiply(BigDecimal.ONE.add(inverseL).subtract(LIQUIDATION_FEE_RATE)).setScale(8, RoundingMode.HALF_UP);
        }
    }

    // 추가 진입 시 포지션 수치 갱신
    public void addEntry(BigDecimal additionalQuantity, BigDecimal newEntryPrice, BigDecimal additionalMargin, BigDecimal additionalNotional) {
        // 새로운 평균 진입가 계산
        // newAvgEntryPrice = (기존수량 * 기존진입가 + 추가수량 * 추가진입가) / (기존수량 + 추가수량)
        BigDecimal existingValue = this.filledQuantity.multiply(this.entryPrice); // 기존수량 * 기존진입가 (+)
        BigDecimal additionalValue = additionalQuantity.multiply(newEntryPrice); // 추가수량 * 추가진입가 (/)
        BigDecimal newTotalQuantity = this.filledQuantity.add(additionalQuantity); // 기존수량 + 추가수량
        BigDecimal newAvgEntryPrice = existingValue.add(additionalValue).divide(newTotalQuantity, 8, RoundingMode.HALF_UP);
        this.entryPrice = newAvgEntryPrice;

        // 2. 수량 합산
        this.filledQuantity = newTotalQuantity;

        // 3. 증거금 합산
        this.totalMargin = this.totalMargin.add(additionalMargin);

        // 4. 명목금액 합산
        this.notionalAmount = this.notionalAmount.add(additionalNotional);

        // 5. 청산가 재계산
        this.liquidationPrice = calculateLiquidationPrice(this.positionSide, this.entryPrice, this.leverage);

    }

    // 레버리지 변경 시 — 증거금·청산가 갱신
    public void updateLeverage(int newLeverage, BigDecimal newTotalMargin) {
        this.leverage = newLeverage;
        this.totalMargin = newTotalMargin;
        this.liquidationPrice = calculateLiquidationPrice(this.positionSide, this.entryPrice, newLeverage);
    }

    // 청산 시 포지션 수치 차감
    public void reduce(BigDecimal closeQuantity, BigDecimal closeMargin, BigDecimal closeNotional, BigDecimal pnl) {
        // 수량 / 증거금 / 명목금액 차감
        this.filledQuantity = this.filledQuantity.subtract(closeQuantity);
        this.totalMargin = this.totalMargin.subtract(closeMargin);
        this.notionalAmount = this.notionalAmount.subtract(closeNotional);

        // 누적 실현손익 반영
        this.realizedPnl = this.realizedPnl.add(pnl);

        // 잔여 수량이 0이면 포지션 종료 처리
        if (this.filledQuantity.compareTo(BigDecimal.ZERO) == 0) {
            this.positionStatus = PositionStatus.CLOSE;
        }
        // 수량이 남아있으면 entryPrice·leverage·liquidationPrice 변동 없음 (진입가 불변 원칙)
    }
}