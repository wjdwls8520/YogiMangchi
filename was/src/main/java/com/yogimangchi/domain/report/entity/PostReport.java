package com.yogimangchi.domain.report.entity;

import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.report.enums.ReportReasonType;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(
        name = "post_report",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_post_report_member_post", columnNames = {"member_id", "post_id"})
        }
)
public class PostReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_type", nullable = false, length = 20)
    private ReportReasonType reasonType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static PostReport create(Member member, Post post, ReportReasonType reasonType) {
        PostReport report = new PostReport();
        report.member = member;
        report.post = post;
        report.reasonType = reasonType;
        return report;
    }
}
