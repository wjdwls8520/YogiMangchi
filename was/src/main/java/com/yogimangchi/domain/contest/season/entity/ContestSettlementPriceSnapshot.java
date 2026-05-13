package com.yogimangchi.domain.contest.season.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 대회 시즌 정산용 가격 스냅샷
 *
 * 시즌 종료 시각(contestEndAt) 직후 스케줄러가 해당 시즌에서 거래된 심볼들의
 * 마지막 ticker 가격을 박제해둔다. 이후 어드민이 정산 버튼을 누르면 이 스냅샷
 * 가격을 기준으로 OPEN 포지션의 실현 PnL 을 계산한다.
 *
 *  - 시즌 종료 후 ticker 가 계속 흘러도 정산 결과가 바뀌지 않도록 박제용으로 사용
 *  - (시즌, 심볼) 조합당 1행 — unique constraint 로 중복 캡처 방지 (스케줄러 재실행 멱등성)
 *  - 한 번 기록되면 불변. 수정 메서드 없음.
 *  - 가격 출처는 항상 인메모리 TICKER_CACHE (캐시 비어있으면 정산 실패 → 어드민 재시도)
 */
@Entity
@Table(
        name = "contest_settlement_price_snapshot",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_settlement_snapshot_season_symbol",
                columnNames = {"contest_season_id", "symbol"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Comment("대회 시즌 정산 기준가 스냅샷 — 시즌 종료 시각의 마지막 ticker 가격을 박제")
public class ContestSettlementPriceSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_season_id", nullable = false)
    @Comment("정산 대상 대회 시즌")
    private ContestSeason contestSeason;

    @Column(length = 32, nullable = false)
    @Comment("선물 심볼 (예: BTCUSDT)")
    private String symbol;

    @Column(precision = 19, scale = 8, nullable = false)
    @Comment("정산 기준 가격 — 시즌 종료 시각의 마지막 ticker 값")
    private BigDecimal price;

    @Column(nullable = false)
    @Comment("스냅샷 캡처 일시 — 논리적 정산 기준 시각(시즌 종료 시각 또는 그 직후)")
    private LocalDateTime capturedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    @Comment("DB 행 생성 일시 — 스케줄러가 실제로 기록을 남긴 시각 (capturedAt 과 미세하게 다를 수 있음)")
    private LocalDateTime createdAt;

    // 스냅샷 생성 — 한 번 기록되면 불변이므로 정적 팩토리만 제공
    public static ContestSettlementPriceSnapshot capture(
            ContestSeason contestSeason,
            String symbol,
            BigDecimal price,
            LocalDateTime capturedAt
    ) {
        ContestSettlementPriceSnapshot snapshot = new ContestSettlementPriceSnapshot();
        snapshot.contestSeason = contestSeason;
        snapshot.symbol = symbol.trim().toUpperCase();
        snapshot.price = price;
        snapshot.capturedAt = capturedAt;
        return snapshot;
    }
}
