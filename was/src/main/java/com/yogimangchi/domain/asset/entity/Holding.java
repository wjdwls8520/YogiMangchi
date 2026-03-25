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
    @Comment("현재 보유 수량 (소수점 8자리)")
    private BigDecimal quantity;

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
    public Holding(Assets assets, String symbol, BigDecimal quantity, BigDecimal averageBuyPrice){
        this.assets = assets;
        this.symbol = symbol;
        this.quantity = quantity;
        this.averageBuyPrice = averageBuyPrice;
    }

    // 나중에 매수/매도 로직에서 수량과 평단가를 수정할 때 쓸 메서드
    public void updateHolding(BigDecimal newQuantity, BigDecimal newAverageBuyPrice) {
        this.quantity = newQuantity;
        this.averageBuyPrice = newAverageBuyPrice;
    }

    // 코인을 처음 매수했을 때(신규 보유) 사용하는 팩토리 메서드
    public static Holding createFirstHolding(Assets assets, String symbol, BigDecimal quantity, BigDecimal buyPrice) {
        return Holding.builder()
                .assets(assets)
                .symbol(symbol)
                .quantity(quantity)
                .averageBuyPrice(buyPrice) // 첫 매수니까 평단가가 곧 매수가
                .build();
    }
}