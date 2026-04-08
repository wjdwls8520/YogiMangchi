package com.yogimangchi.domain.contest.application.entity;

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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

// 반려된 대회 신청 이력과 반려 사유를 보관하는 엔티티
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Comment("반려된 대회 신청 이력")
public class ContestRejectedApplicant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contest_season_id", nullable = false)
    @Comment("대회 시즌 ID")
    private ContestSeason contestSeason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    @Comment("반려된 신청 회원 ID")
    private Member member;

    @Column(name = "applied_at", nullable = false)
    @Comment("최초 참가 신청 일시")
    private LocalDateTime appliedAt;

    @Column(name = "reject_reason", nullable = false, length = 255)
    @Comment("반려 사유")
    private String rejectReason;

    @Column(name = "rejected_by_admin_id", nullable = false)
    @Comment("반려 처리 관리자 회원 ID")
    private Long rejectedByAdminId;

    @CreationTimestamp
    @Column(name = "rejected_at", nullable = false, updatable = false)
    @Comment("반려 처리 일시")
    private LocalDateTime rejectedAt;

    public static ContestRejectedApplicant create(
            ContestApplicant contestApplicant,
            String rejectReason,
            Long rejectedByAdminId
    ) {
        ContestRejectedApplicant contestRejectedApplicant = new ContestRejectedApplicant();
        contestRejectedApplicant.contestSeason = contestApplicant.getContestSeason();
        contestRejectedApplicant.member = contestApplicant.getMember();
        contestRejectedApplicant.appliedAt = contestApplicant.getCreatedAt();
        contestRejectedApplicant.rejectReason = rejectReason;
        contestRejectedApplicant.rejectedByAdminId = rejectedByAdminId;
        return contestRejectedApplicant;
    }
}
