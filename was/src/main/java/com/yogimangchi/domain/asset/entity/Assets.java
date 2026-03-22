package com.yogimangchi.domain.asset.entity;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.member.entity.Member;
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
@Comment("사용자의 모의투자 계좌정보")
public class Assets {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Comment("지갑 종류 (SPOT: 현물, FUTURE: 선물, CONTEST: 대회용)")
    private AssetType type;

    @Column(name = "seed_money", nullable = false, precision = 19, scale = 4)
    @Comment("초기 지급 자금")
    private BigDecimal seedMoney;

    @Column(name = "current_money", nullable = false, precision = 19, scale = 4)
    @Comment("현재 보유 현금")
    private BigDecimal currentMoney;

    @Column(nullable = false)
    @Comment("계좌 상태 (ACTIVE: 활성, INACTIVE: 비활성)")
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    protected Assets(Member member, AssetType type, BigDecimal seedMoney, BigDecimal currentMoney, String status) {
        this.member = member;
        this.type = type;
        this.seedMoney = seedMoney;
        this.currentMoney = currentMoney;
        this.status = status;
    }

    public static Assets createSpotAssets(Member member, BigDecimal seedMoney) {
        return Assets.builder()
                .member(member)
                .type(AssetType.SPOT)
                .seedMoney(seedMoney)
                .currentMoney(seedMoney)
                .status("INACTIVE")
                .build();
    }
}
