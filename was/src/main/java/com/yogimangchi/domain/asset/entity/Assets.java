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

    @Column(name = "asset_type", nullable = false)
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

    @Column(name = "retry_count", nullable = false)
    @Comment("재도전 횟수 (0부터 시작, 최대 5회)")
    private int retryCount;

    @Column(name = "expired_at", nullable = false)
    @Comment("콘텐츠 만료 일시")
    private LocalDateTime expiredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    protected Assets(Member member, AssetType type, BigDecimal seedMoney, BigDecimal currentMoney, String status,  int retryCount, LocalDateTime expiredAt) {
        this.member = member;
        this.type = type;
        this.seedMoney = seedMoney;
        this.currentMoney = currentMoney;
        this.status = status;
        this.retryCount = retryCount;
        this.expiredAt = expiredAt;
    }

    // 새로운 지갑을 발급
    public static Assets createNewWallet(Member member, AssetType type, BigDecimal initialMoney, int retryCount, LocalDateTime expiredAt) {
        return Assets.builder()
                .member(member)
                .type(type)
                .seedMoney(initialMoney)
                .currentMoney(initialMoney) // 초기 자금을 잔고에 그대로 세팅
                .status("ACTIVE")
                .retryCount(retryCount)
                .expiredAt(expiredAt)
                .build();
    }

    public void addMoney(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("더할 금액은 0보다 커야 합니다.");
        }
        // 현재 잔액 + 들어온 금액
        this.currentMoney = this.currentMoney.add(amount);
    }

    // 코인 매수 시: 내 지갑에서 현금을 차감하는 기능
    public void subtractMoney(BigDecimal amount) {

        // 음수나 0원 차감 시도 차단
        if (amount == null) {
            throw new IllegalArgumentException("금액이 없습니다.");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("금액은 0보다 커야 합니다.");
        }

        // 잔액 검사
        if (this.currentMoney.compareTo(amount) < 0) {
            throw new IllegalArgumentException("잔고가 부족합니다.");
        }

        // 현재 잔액 - 나가는 금액
        this.currentMoney = this.currentMoney.subtract(amount);
    }

    // 지갑 만료 처리 메서드
    public void expireWallet() {
        this.status = "EXPIRED";
    }
}
