package com.yogimangchi.domain.contest.entity;

import com.yogimangchi.domain.contest.enums.ContestApplicantStatus;
import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

// 회원이 특정 대회 시즌에 참가 신청한 내역과 신청 상태를 담는 엔티티
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_contest_applicant_season_member",
                        columnNames = {"contest_season_id", "member_id"}
                )
        }
)
@Comment("대회 신청자 정보")
public class ContestApplicant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_season_id", nullable = false)
    @Comment("대회 시즌 ID")
    private ContestSeason contestSeason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @Comment("신청 회원 ID")
    private Member member;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Comment("신청 상태 (PENDING: 승인대기, APPROVED: 승인완료, REJECTED: 반려)")
    private ContestApplicantStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("신청 생성 일시")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    @Comment("신청 수정 일시")
    private LocalDateTime updatedAt;

    public static ContestApplicant create(ContestSeason contestSeason, Member member) {
        ContestApplicant contestApplicant = new ContestApplicant();
        contestApplicant.contestSeason = contestSeason;
        contestApplicant.member = member;
        contestApplicant.status = ContestApplicantStatus.PENDING;
        return contestApplicant;
    }

    public void approve() {
        this.status = ContestApplicantStatus.APPROVED;
    }

    public void reject() {
        this.status = ContestApplicantStatus.REJECTED;
    }
}
