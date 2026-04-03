package com.yogimangchi.domain.contest.entity;

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

    public static ContestParticipant create(ContestApplicant contestApplicant, Long approvedByAdminId) {
        ContestParticipant contestParticipant = new ContestParticipant();
        contestParticipant.contestSeason = contestApplicant.getContestSeason();
        contestParticipant.member = contestApplicant.getMember();
        contestParticipant.appliedAt = contestApplicant.getCreatedAt();
        contestParticipant.approvedAt = LocalDateTime.now();
        contestParticipant.approvedByAdminId = approvedByAdminId;
        return contestParticipant;
    }
}
