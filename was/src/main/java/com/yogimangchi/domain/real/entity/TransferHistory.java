package com.yogimangchi.domain.real.entity;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.real.enums.TransferStatus;
import com.yogimangchi.domain.real.enums.TransferType;
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
@Table(name = "transfer_history", uniqueConstraints = {
        // 따닥(멱등성) 방지를 위한 Unique 제약조건
        @UniqueConstraint(name = "uk_transfer_history_request_id", columnNames = {"request_id"})
})
@Comment("본투자 지갑 간 자산 이체 내역 및 감사 로그")
public class TransferHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @Comment("이체 요청 사용자")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_asset_id", nullable = false)
    @Comment("출금 지갑")
    private Assets fromAsset;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_asset_id", nullable = false)
    @Comment("입금 지갑")
    private Assets toAsset;

    @Column(name = "transfer_type", nullable = false)
    @Enumerated(EnumType.STRING)
    @Comment("이체 종류 (현물->선물 등)")
    private TransferType transferType;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    @Comment("이체 요청 금액")
    private BigDecimal amount;

    @Column(name = "from_balance_after", nullable = false, precision = 19, scale = 4)
    @Comment("이체 후 출금 지갑의 잔액 스냅샷")
    private BigDecimal fromBalanceAfter;

    @Column(name = "to_balance_after", nullable = false, precision = 19, scale = 4)
    @Comment("이체 후 입금 지갑의 잔액 스냅샷")
    private BigDecimal toBalanceAfter;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    @Comment("이체 결과 상태")
    private TransferStatus status;

    @Column(name = "request_id", nullable = false, length = 100)
    @Comment("프론트엔드에서 생성한 고유 요청 ID (멱등성 키)")
    private String requestId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    protected TransferHistory(
            Member member,
            Assets fromAsset,
            Assets toAsset,
            TransferType transferType,
            BigDecimal amount,
            BigDecimal fromBalanceAfter,
            BigDecimal toBalanceAfter,
            TransferStatus status,
            String requestId
    ) {
        this.member = member;
        this.fromAsset = fromAsset;
        this.toAsset = toAsset;
        this.transferType = transferType;
        this.amount = amount;
        this.fromBalanceAfter = fromBalanceAfter;
        this.toBalanceAfter = toBalanceAfter;
        this.status = status;
        this.requestId = requestId;
    }
}
