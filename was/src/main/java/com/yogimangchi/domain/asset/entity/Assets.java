package com.yogimangchi.domain.asset.entity;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@org.hibernate.annotations.Comment("사용자의 모의투자 계좌 정보")
public class Assets {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "asset_type", nullable = false)
    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.Comment("지갑 타입(MOCK: 모의투자, TRADE_SPOT: 실전 현물, TRADE_FUTURE: 실전 선물, CONTEST: 대회 선물)")
    private AssetType type;

    @Column(name = "seed_money", nullable = false, precision = 19, scale = 4)
    @org.hibernate.annotations.Comment("초기 지급 자금")
    private BigDecimal seedMoney;

    @Column(name = "current_money", nullable = false, precision = 19, scale = 4)
    @org.hibernate.annotations.Comment("현재 보유 가능한 현금 잔고")
    private BigDecimal currentMoney;

    @Column(name = "locked_money", nullable = false, precision = 19, scale = 4)
    @org.hibernate.annotations.Comment("지정가 매수 대기 중인 잠금 금액")
    private BigDecimal lockedMoney;

    @Column(nullable = false)
    @org.hibernate.annotations.Comment("계좌 상태(ACTIVE: 활성, INACTIVE: 비활성, EXPIRED: 만료)")
    private String status;

    @Column(name = "retry_count", nullable = false)
    @org.hibernate.annotations.Comment("재시도 횟수(모의투자 현물은 재도전 횟수, 대회에서는 회차 개념으로 사용)")
    private int retryCount;

    @Column(name = "expired_at", nullable = false)
    @org.hibernate.annotations.Comment("콘텐츠 만료 일시")
    private LocalDateTime expiredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_season_id")
    @org.hibernate.annotations.Comment("대회 지갑이 속한 시즌 ID")
    private ContestSeason contestSeason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    protected Assets(
            Member member,
            AssetType type,
            BigDecimal seedMoney,
            BigDecimal currentMoney,
            BigDecimal lockedMoney,
            String status,
            int retryCount,
            LocalDateTime expiredAt,
            ContestSeason contestSeason
    ) {
        this.member = member;
        this.type = type;
        this.seedMoney = seedMoney;
        this.currentMoney = currentMoney;
        this.lockedMoney = lockedMoney;
        this.status = status;
        this.retryCount = retryCount;
        this.expiredAt = expiredAt;
        this.contestSeason = contestSeason;
    }

    // 새 지갑 발급
    public static Assets createNewWallet(Member member, AssetType type, BigDecimal initialMoney, int retryCount, LocalDateTime expiredAt) {
        return Assets.builder()
                .member(member)
                .type(type)
                .seedMoney(initialMoney)
                .currentMoney(initialMoney)
                .lockedMoney(BigDecimal.ZERO)
                .status("ACTIVE")
                .retryCount(retryCount)
                .expiredAt(expiredAt)
                .contestSeason(null)
                .build();
    }

    // 새 대회 선물 지갑 발급
    public static Assets createNewContestFuturesWallet(
            Member member,
            AssetType type,
            BigDecimal initialMoney,
            int retryCount,
            LocalDateTime expiredAt,
            ContestSeason contestSeason
    ) {
        return Assets.builder()
                .member(member)
                .type(type)
                .seedMoney(initialMoney)
                .currentMoney(initialMoney)
                .lockedMoney(BigDecimal.ZERO)
                .status("ACTIVE")
                .retryCount(retryCount)
                .expiredAt(expiredAt)
                .contestSeason(contestSeason)
                .build();
    }

    // 금액 증가 반영
    public void addMoney(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("추가할 금액은 0보다 커야 합니다.");
        }
        this.currentMoney = this.currentMoney.add(amount);
    }

    // 지정가 매수 예약 금액 잠금
    public void lockMoney(BigDecimal amount) {
        validatePositiveAmount(amount, "잠글 금액");

        if (this.currentMoney.compareTo(amount) < 0) {
            throw new IllegalArgumentException("주문 가능한 금액 잔고가 부족합니다.");
        }

        this.currentMoney = this.currentMoney.subtract(amount);
        this.lockedMoney = this.lockedMoney.add(amount);
    }

    // 주문 취소 시 예약 금액 복구
    public void unlockMoney(BigDecimal amount) {
        validatePositiveAmount(amount, "해제할 금액");

        if (this.lockedMoney.compareTo(amount) < 0) {
            throw new IllegalArgumentException("잠긴 금액보다 많이 해제할 수 없습니다.");
        }

        this.lockedMoney = this.lockedMoney.subtract(amount);
        this.currentMoney = this.currentMoney.add(amount);
    }

    // 주문 체결 시 예약 금액 차감
    public void consumeLockedMoney(BigDecimal amount) {
        validatePositiveAmount(amount, "차감할 금액");

        if (this.lockedMoney.compareTo(amount) < 0) {
            throw new IllegalArgumentException("잠긴 금액보다 많이 차감할 수 없습니다.");
        }

        this.lockedMoney = this.lockedMoney.subtract(amount);
    }

    // 즉시 차감되는 현금 사용
    public void subtractMoney(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("금액이 없습니다.");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("금액은 0보다 커야 합니다.");
        }
        if (this.currentMoney.compareTo(amount) < 0) {
            throw new IllegalArgumentException("잔고가 부족합니다.");
        }

        this.currentMoney = this.currentMoney.subtract(amount);
    }

    // 지갑 만료 상태 전환
    public void expireWallet() {
        this.status = "EXPIRED";
    }

    private void validatePositiveAmount(BigDecimal amount, String label) {
        if (amount == null) {
            throw new IllegalArgumentException(label + " 값이 없습니다.");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(label + "은(는) 0보다 커야 합니다.");
        }
    }
}
