package com.yogimangchi.domain.market.entity;

import com.yogimangchi.domain.market.enums.MarketType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "market_symbol")
@Comment("거래 가능한 코인 종류(메뉴판) 관리")
public class MarketSymbol {

    @Id
    @Column(length = 20)
    @Comment("코인 심볼 (PK) - 예: BTCUSDT")
    private String symbol;

    @Column(name = "market_type", nullable = false)
    @Enumerated(EnumType.STRING)
    @Comment("거래 지원 시장 (SPOT: 현물 전용, FUTURE: 선물 전용, BOTH: 둘 다 지원)")
    private MarketType marketType;

    @Column(name = "base_asset", nullable = false, length = 20)
    @Comment("기초 자산 - 예: BTC")
    private String baseAsset;

    @Column(name = "quote_asset", nullable = false, length = 20)
    @Comment("결제 자산 - 예: USDT")
    private String quoteAsset;

    @Column(name = "display_name_en", nullable = false, length = 50)
    @Comment("화면 표시 이름 (영어) - 예: Bitcoin")
    private String displayNameEn;

    @Column(name = "display_name_kr", nullable = false, length = 50)
    @Comment("화면 표시 이름 (한글) - 예: 비트코인")
    private String displayNameKr;

    @Column(name = "is_active", nullable = false)
    @Comment("거래 가능 여부 (TRUE: 활성, FALSE: 거래중지/상장폐지)")
    private boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    protected MarketSymbol(String symbol, String baseAsset, String quoteAsset, String displayNameEn, String displayNameKr, boolean isActive) {
        this.symbol = symbol;
        this.marketType = marketType;
        // this.marketType = MarketType.SPOT;
        this.baseAsset = baseAsset;
        this.quoteAsset = quoteAsset;
        this.displayNameEn = displayNameEn;
        this.displayNameKr = displayNameKr;
        this.isActive = isActive;
    }
}