package com.yogimangchi.domain.asset.entity;

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
@Table(name = "portfolio_snapshot")
@Comment("특정 시점의 계좌/자산 요약 스냅샷 (주로 자정 배치로 생성)")
public class PortfolioSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id", nullable = false)
    @Comment("스냅샷이 기록된 지갑(계좌) ID")
    private Assets assets;

    @Column(name = "cash_balance", nullable = false, precision = 19, scale = 4)
    @Comment("스냅샷 당시 보유 현금 잔액")
    private BigDecimal cashBalance;

    @Column(name = "coin_asset_value", nullable = false, precision = 19, scale = 4)
    @Comment("스냅샷 당시 보유 코인들의 평가 금액 합계")
    private BigDecimal coinAssetValue;

    @Column(name = "total_asset", nullable = false, precision = 19, scale = 4)
    @Comment("스냅샷 당시 총 자산 (cash_balance + coin_asset_value)")
    private BigDecimal totalAsset;

    @Column(name = "profit_amount", nullable = false, precision = 19, scale = 4)
    @Comment("스냅샷 당시 누적 손익 금액 (총 자산 - 초기 자본금)")
    private BigDecimal profitAmount;

    @Column(name = "profit_rate", nullable = false, precision = 19, scale = 4)
    @Comment("스냅샷 당시 수익률 (%)")
    private BigDecimal profitRate;

    @CreationTimestamp
    @Column(name = "recorded_at", nullable = false, updatable = false)
    @Comment("스냅샷이 기록된 시각")
    private LocalDateTime recordedAt;

    @Builder
    protected PortfolioSnapshot(Assets assets, BigDecimal cashBalance, BigDecimal coinAssetValue, BigDecimal totalAsset, BigDecimal profitAmount, BigDecimal profitRate) {
        this.assets = assets;
        this.cashBalance = cashBalance;
        this.coinAssetValue = coinAssetValue;
        this.totalAsset = totalAsset;
        this.profitAmount = profitAmount;
        this.profitRate = profitRate;
    }


}
