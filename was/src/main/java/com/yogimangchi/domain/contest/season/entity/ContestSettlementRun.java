package com.yogimangchi.domain.contest.season.entity;

import com.yogimangchi.domain.contest.season.enums.SettlementRunPhase;
import com.yogimangchi.domain.contest.season.enums.SettlementRunStatus;
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
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 대회 시즌 정산 실행 이력 (감사 로그)
 *
 * <p>정산이 트리거될 때마다 1행이 INSERT 되어 어드민/운영자가 "정산이 어디까지 진행됐는지",
 * "성공/실패했는지", "누가 언제 돌렸는지" 를 한눈에 파악할 수 있게 한다.</p>
 */
@Entity
@Table(name = "contest_settlement_run")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Comment("대회 시즌 정산 실행 이력 — 한 행 = 한 정산 시도")
public class ContestSettlementRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_season_id", nullable = false)
    @Comment("정산 대상 대회 시즌")
    private ContestSeason contestSeason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Comment("실행 상태 (RUNNING, COMPLETED, FAILED)")
    private SettlementRunStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_phase", length = 40)
    @Comment("진행 중인 정산 단계 (실패 시엔 실패한 단계, 성공 시엔 마지막으로 진입했던 단계)")
    private SettlementRunPhase currentPhase;

    @Enumerated(EnumType.STRING)
    @Column(name = "failed_phase", length = 40)
    @Comment("실패한 정산 단계 — status=FAILED 일 때만 값이 채워짐")
    private SettlementRunPhase failedPhase;

    @Column(name = "triggered_by", length = 50, nullable = false)
    @Comment("정산 트리거 주체 — 'ADMIN:{adminId}' 또는 'SYSTEM_SCHEDULER'")
    private String triggeredBy;

    @Column(name = "started_at", nullable = false)
    @Comment("정산 시작 시각 (start() 호출 시점)")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    @Comment("정산 종료 시각 — 성공/실패 무관하게 라이프사이클 종결 시점")
    private LocalDateTime finishedAt;

    // 정산의 각 세부 진행 단계별 처리 결과 카운트 — 해당 단계가 완료될 때 채워짐
    // 미완 상태에서는 null/0 일 수 있음

    @Column(name = "registry_pending_orders_deregistered")
    @Comment("인메모리 동기화 단계 결과 — 차감한 미체결 지정가 주문 수")
    private Integer registryPendingOrdersDeregistered;

    @Column(name = "registry_open_positions_deregistered")
    @Comment("인메모리 동기화 단계 결과 — 차감한 오픈 포지션 수")
    private Integer registryOpenPositionsDeregistered;

    @Column(name = "positions_closed_count")
    @Comment("포지션 일괄 청산 단계 결과 — 새로 CLOSE 처리된 포지션 수")
    private Integer positionsClosedCount;

    @Column(name = "wallets_deactivated_count")
    @Comment("지갑 비활성화 단계 결과 — 비활성화 처리된 지갑 수")
    private Integer walletsDeactivatedCount;

    @Column(name = "participants_finalized_count")
    @Comment("참가자 최종 결과 저장 단계 결과 — 최종 결과 확정된 참가자 수")
    private Integer participantsFinalizedCount;

    @Column(name = "last_error_message", length = 1000)
    @Comment("실패 시 마지막 예외 메시지 — 너무 길면 잘림")
    private String lastErrorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("행 생성 일시")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Comment("행 마지막 수정 일시")
    private LocalDateTime updatedAt;

    // 정산 시작 — RUNNING 상태로 1행 INSERT
    public static ContestSettlementRun start(ContestSeason contestSeason, String triggeredBy, LocalDateTime startedAt) {
        ContestSettlementRun run = new ContestSettlementRun();
        run.contestSeason = contestSeason;
        run.status = SettlementRunStatus.RUNNING;
        run.triggeredBy = triggeredBy;
        run.startedAt = startedAt;
        return run;
    }

    // 현재 진행 중인 정산 단계 기록 — 각 단계 진입 직전 호출
    public void markPhase(SettlementRunPhase phase) {
        this.currentPhase = phase;
    }

    // 인메모리 동기화 결과 기록 — 차감한 미체결 주문 수와 오픈 포지션 수
    public void recordRegistrySync(int pendingOrders, int openPositions) {
        this.registryPendingOrdersDeregistered = pendingOrders;
        this.registryOpenPositionsDeregistered = openPositions;
    }

    // 포지션 청산 결과 기록 — 포지션 청산 직후
    public void recordPositionClose(int count) {
        this.positionsClosedCount = count;
    }

    // 지갑 비활성화 결과 기록 — 지갑 비활성화 직후
    public void recordWalletDeactivate(int count) {
        this.walletsDeactivatedCount = count;
    }

    // 참가자 최종 결과 저장 완료 기록 — 결과 저장 직후
    public void recordParticipantFinalize(int count) {
        this.participantsFinalizedCount = count;
    }

    // 정상 완료 — 모든 단계를 통과한 후 호출
    public void markCompleted(LocalDateTime finishedAt) {
        this.status = SettlementRunStatus.COMPLETED;
        this.finishedAt = finishedAt;
    }

    // 실패 처리 — 예외 발생 시 currentPhase 를 failedPhase 로 박제하고 메시지 저장
    // errorMessage 가 길면 1000자에서 자름 (DB 컬럼 한계 + 가독성)
    public void markFailed(LocalDateTime finishedAt, String errorMessage) {
        this.status = SettlementRunStatus.FAILED;
        this.failedPhase = this.currentPhase;
        this.finishedAt = finishedAt;
        this.lastErrorMessage = truncateMessage(errorMessage);
    }

    private static String truncateMessage(String message) {
        if (message == null) {
            return null;
        }
        return message.length() > 1000 ? message.substring(0, 1000) : message;
    }
}
