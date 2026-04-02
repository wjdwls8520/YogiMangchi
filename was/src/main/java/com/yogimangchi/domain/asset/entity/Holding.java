package com.yogimangchi.domain.asset.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "holding",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"asset_id", "symbol"})
        }
)
@Comment("사용자의 지갑별 보유 코인 상세 내역")
public class Holding {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    @Comment("소속된 지갑 ID")
    private Assets assets;

    @Column(nullable = false, length = 20)
    @Comment("코인 심볼명")
    private String symbol;

    @Column(nullable = false, precision = 19, scale = 8)
    @Comment("현재 보유 (가용 가능한) 수량 (소수점 8자리)")
    private BigDecimal quantity;

    @Column(name = "locked_quantity", nullable = false, precision = 19, scale = 8)
    @Comment("지정가 매도 대기 중인 묶인(잠긴) 수량")
    private BigDecimal lockedQuantity;

    @Column(name = "average_buy_price", nullable = false, precision = 19, scale = 8)
    @Comment("매수 평균 단가 (원화/달러 기준)")
    private BigDecimal averageBuyPrice;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Holding(Assets assets, String symbol, BigDecimal quantity, BigDecimal lockedQuantity, BigDecimal averageBuyPrice){
        this.assets = assets;
        this.symbol = symbol;
        this.quantity = quantity;
        this.lockedQuantity = lockedQuantity;
        this.averageBuyPrice = averageBuyPrice;
    }

    // 보유 수량 및 평균 매수가 갱신
    public void updateHolding(BigDecimal newQuantity, BigDecimal newAverageBuyPrice) {
        this.quantity = newQuantity;
        this.averageBuyPrice = newAverageBuyPrice;
    }

    // 지정가 매도 예약 수량 잠금
    public void lockQuantity(BigDecimal quantityToLock) {
        validatePositiveQuantity(quantityToLock, "잠글 수량");

        if (this.quantity.compareTo(quantityToLock) < 0) {
            throw new IllegalArgumentException("주문 가능한 보유 수량이 부족합니다.");
        }

        this.quantity = this.quantity.subtract(quantityToLock);
        this.lockedQuantity = this.lockedQuantity.add(quantityToLock);
    }

    // 주문 취소 시 예약 수량 복구
    public void unlockQuantity(BigDecimal quantityToUnlock) {
        validatePositiveQuantity(quantityToUnlock, "해제할 수량");

        if (this.lockedQuantity.compareTo(quantityToUnlock) < 0) {
            throw new IllegalArgumentException("잠긴 수량보다 더 많이 해제할 수 없습니다.");
        }

        this.lockedQuantity = this.lockedQuantity.subtract(quantityToUnlock);
        this.quantity = this.quantity.add(quantityToUnlock);
    }

    // 주문 체결 시 예약 수량 소진
    public void consumeLockedQuantity(BigDecimal quantityToConsume) {
        validatePositiveQuantity(quantityToConsume, "소진할 수량");

        if (this.lockedQuantity.compareTo(quantityToConsume) < 0) {
            throw new IllegalArgumentException("잠긴 수량보다 더 많이 소진할 수 없습니다.");
        }

        this.lockedQuantity = this.lockedQuantity.subtract(quantityToConsume);
    }

    // 신규 보유 종목 생성 팩토리
    public static Holding createFirstHolding(Assets assets, String symbol, BigDecimal quantity, BigDecimal buyPrice) {
        return Holding.builder()
                .assets(assets)
                .symbol(symbol)
                .quantity(quantity)
                .lockedQuantity(BigDecimal.ZERO) // 잠금 수량 0 초기화
                .averageBuyPrice(buyPrice) // 첫 매수 단가 기준 평균가 설정
                .build();
    }

    private void validatePositiveQuantity(BigDecimal quantity, String label) {
        if (quantity == null) {
            throw new IllegalArgumentException(label + "이(가) 없습니다.");
        }
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(label + "은(는) 0보다 커야 합니다.");
        }
    }
}
