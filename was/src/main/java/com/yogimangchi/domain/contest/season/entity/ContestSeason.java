package com.yogimangchi.domain.contest.season.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// 대회 한 회차의 제목, 설명, 모집 기간, 진행 기간, 현재 상태를 관리하는 엔티티
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Comment("대회 시즌 정보")
public class ContestSeason {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    @Comment("대회 시즌 제목")
    private String title;

    @Column(length = 255, nullable = false)
    @Comment("대회 시즌 설명")
    private String description;

    @Column(nullable = false)
    @Comment("대회 참가 신청 시작 일시")
    private LocalDateTime recruitmentStartAt;

    @Column(nullable = false)
    @Comment("대회 참가 신청 종료 일시")
    private LocalDateTime recruitmentEndAt;

    @Column(nullable = false)
    @Comment("대회 실제 시작 일시")
    private LocalDateTime contestStartAt;

    @Column(nullable = false)
    @Comment("대회 실제 종료 일시")
    private LocalDateTime contestEndAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    @Comment("대회 시즌 생성 일시")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    @Comment("대회 시즌 수정 일시")
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    @Comment("대회 시즌 참가자 수")
    private Long participantCount;

    @Column(nullable = false)
    @Comment("대회 시즌 공개 상태 (isPublic: true)")
    private boolean isPublic;

    @Column(nullable = false)
    @Comment("대회 시즌 취소 상태 (isCancel: true)")
    private boolean isCancel;

    // 정산(강제종료) 완료 시각 — NULL 이면 미정산, 값이 있으면 그 시각에 정산이 끝났다는 뜻
    // settleContestSeason() 호출 시 멱등 가드로도 사용됨
    @Column
    @Comment("정산(강제종료) 완료 일시 — NULL 이면 아직 정산되지 않음")
    private LocalDateTime settledAt;

    public static ContestSeason create(
            String title,
            String description,
            LocalDateTime recruitmentStartAt,
            LocalDateTime recruitmentEndAt,
            LocalDateTime contestStartAt,
            LocalDateTime contestEndAt
    ) {
        ContestSeason contestSeason = new ContestSeason();
        contestSeason.title = title;
        contestSeason.description = description;
        contestSeason.recruitmentStartAt = recruitmentStartAt;
        contestSeason.recruitmentEndAt = recruitmentEndAt;
        contestSeason.contestStartAt = contestStartAt;
        contestSeason.contestEndAt = contestEndAt;
        contestSeason.participantCount = 0L;
        contestSeason.isPublic = false;
        contestSeason.isCancel = false;
        return contestSeason;
    }

    public void updateSeasonInfo(
            String title,
            String description,
            LocalDateTime recruitmentStartAt,
            LocalDateTime recruitmentEndAt,
            LocalDateTime contestStartAt,
            LocalDateTime contestEndAt
    ) {
        this.title = title;
        this.description = description;
        this.recruitmentStartAt = recruitmentStartAt;
        this.recruitmentEndAt = recruitmentEndAt;
        this.contestStartAt = contestStartAt;
        this.contestEndAt = contestEndAt;
    }

    public void updateStatus(
            boolean isPublic,
            boolean isCancel
    ) {
        this.isPublic = isPublic;
        this.isCancel = isCancel;
    }

    // 정산 완료 처리 — settledAt 에 시각을 박아 멱등 가드의 기준으로 사용
    public void markSettled(LocalDateTime settledAt) {
        this.settledAt = settledAt;
    }

    // 이미 정산이 끝났는지 여부 — 멱등 호출 시 빠른 분기용
    public boolean isSettled() {
        return this.settledAt != null;
    }
}
