package com.yogimangchi.domain.market.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "futures_symbol_policy")
@Comment("선물 거래를 지원하는 심볼의 레버리지 정책 (FUTURE/BOTH 심볼만 row 존재)")
public class FuturesSymbolPolicy {

    @Id
    @Column(length = 20)
    @Comment("심볼 (PK, FK → market_symbol)")
    private String symbol;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // 기본키 끼리
    @JoinColumn(name = "symbol")
    private MarketSymbol marketSymbol;

    @Column(name = "max_leverage", nullable = false)
    @Comment("본투자 선물 지갑에서 허용되는 최대 레버리지 배수")
    private int maxLeverage;

    @Column(name = "contest_max_leverage", nullable = false)
    @Comment("대회 선물 지갑에서 허용되는 최대 레버리지 배수")
    private int contestMaxLeverage;

    @Builder
    protected FuturesSymbolPolicy(MarketSymbol marketSymbol, int maxLeverage, int contestMaxLeverage) {
        this.marketSymbol = marketSymbol;
        this.maxLeverage = maxLeverage;
        this.contestMaxLeverage = contestMaxLeverage;
    }
}
