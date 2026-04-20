package com.yogimangchi.domain.futures.entity;

import com.yogimangchi.domain.asset.entity.Assets;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "futures_leverage_setting",
        uniqueConstraints = @UniqueConstraint(columnNames = {"assets_id", "symbol"})
)
@Comment("선물 지갑별 심볼별 레버리지 설정 (유저가 직접 변경, 기본값 1배)")
public class FuturesLeverageSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assets_id", nullable = false)
    @Comment("레버리지 설정이 속한 선물 지갑")
    private Assets assets;

    @Column(nullable = false, length = 20)
    @Comment("레버리지 설정 대상 심볼 - 예: BTCUSDT")
    private String symbol;

    @Column(nullable = false)
    @Comment("현재 설정된 레버리지 배수 (기본 1배)")
    private int leverage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static FuturesLeverageSetting createDefault(Assets assets, String symbol) {
        FuturesLeverageSetting setting = new FuturesLeverageSetting();
        setting.assets = assets;
        setting.symbol = symbol;
        setting.leverage = 1;
        return setting;
    }

    public void updateLeverage(int leverage) {
        this.leverage = leverage;
    }
}
