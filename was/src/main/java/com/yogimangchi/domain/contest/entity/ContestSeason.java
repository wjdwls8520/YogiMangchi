package com.yogimangchi.domain.contest.entity;

import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
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
    @Enumerated(EnumType.STRING)
    @Comment("대회 시즌 상태 (DRAFT: 생성됨, RECRUITING: 모집중, LIVE: 진행중, FINISHED: 종료, CANCELED: 취소)")
    private ContestSeasonStatus status;

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
        contestSeason.status = ContestSeasonStatus.DRAFT;
        return contestSeason;
    }
}
