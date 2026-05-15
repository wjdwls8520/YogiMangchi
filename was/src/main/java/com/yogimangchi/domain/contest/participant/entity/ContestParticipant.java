package com.yogimangchi.domain.contest.participant.entity;

import com.yogimangchi.domain.contest.application.entity.ContestApplicant;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
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
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 승인된 대회 참가자 정보를 담는 엔티티
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_contest_participant_season_member",
                        columnNames = {"contest_season_id", "member_id"}
                )
        }
)
@Comment("대회 참가자 정보")
public class ContestParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_season_id", nullable = false)
    @Comment("대회 시즌 ID")
    private ContestSeason contestSeason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @Comment("대회 참가 회원 ID")
    private Member member;

    @Column(name = "applied_at", nullable = false)
    @Comment("최초 참가 신청 일시")
    private LocalDateTime appliedAt;

    @Column(name = "approved_at", nullable = false)
    @Comment("참가 승인 일시")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by_admin_id", nullable = false)
    @Comment("참가 승인 처리 관리자 회원 ID")
    private Long approvedByAdminId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("참가자 생성 일시")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Comment("참가자 수정 일시")
    private LocalDateTime updatedAt;

    // 최종 결과 저장 필드 — 참가자 최종 결과 산출 시 한 번만 채워지고 그 이후 불변
    //
    // NULL 일 때: 아직 정산되지 않은 참가자 (진행 중 시즌 또는 정산 직전 상태)
    // 값이 있을 때: 정산 완료된 최종 결과. 사용자 조회 API 는 settledAt 분기 후 이 값을 단일 SELECT 로 사용
    //
    // 비정규화(Frozen Aggregate) 정책
    //   - 진행 중에는 절대 손대지 않음 (실시간 PnL 계산은 별도 경로에서 수행)
    //   - 정산 시점에 한 번만 박제 — 카운터캐시(증분 유지) 와 다른 패턴
    //   - 박제 이후로는 read-only — 무효화 불필요

    @Column(name = "final_realized_pnl", precision = 19, scale = 8)
    @Comment("정산 시점 실현 손익 합계 — 시즌 내 모든 CLOSED 포지션의 realizedPnl 합")
    private BigDecimal finalRealizedPnl;

    @Column(name = "final_profit_rate", precision = 10, scale = 4)
    @Comment("정산 시점 수익률(%) — (finalRealizedPnl / 본인 seedMoney 합) × 100")
    private BigDecimal finalProfitRate;

    @Column(name = "final_rank")
    @Comment("정산 시점 시즌 내 순위 — finalRealizedPnl 내림차순. RANK 방식(1,2,2,4)")
    private Integer finalRank;

    public static ContestParticipant create(ContestApplicant contestApplicant, Long approvedByAdminId) {
        ContestParticipant contestParticipant = new ContestParticipant();
        contestParticipant.contestSeason = contestApplicant.getContestSeason();
        contestParticipant.member = contestApplicant.getMember();
        contestParticipant.appliedAt = contestApplicant.getCreatedAt();
        contestParticipant.approvedAt = LocalDateTime.now();
        contestParticipant.approvedByAdminId = approvedByAdminId;
        return contestParticipant;
    }

    // 정산 결과 저장 — 최종 결과 산출 단계(ContestSettlementAggregator)에서 한 번만 호출되어 최종 결과를 영구 저장
    //
    // 멱등 가드: 이미 박제된 참가자는 덮어쓰기 허용 (재실행 시 같은 값 → 안전)
    // 단, 박제는 정산 트리거 1회당 1번만 일어나야 하므로 호출자 측에서 흐름 통제 필요
    public void markFinalResult(BigDecimal finalRealizedPnl, BigDecimal finalProfitRate, Integer finalRank) {
        this.finalRealizedPnl = finalRealizedPnl;
        this.finalProfitRate = finalProfitRate;
        this.finalRank = finalRank;
    }

    // 박제 여부 확인 — 사용자 조회 API 가 settledAt 외에도 본인 박제 확정 여부 분기에 사용 가능
    public boolean isFinalized() {
        return this.finalRealizedPnl != null;
    }
}
