package com.yogimangchi.domain.report.entity;

import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.report.enums.ReportReasonType;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(
        name = "reply_report",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_reply_report_member_reply", columnNames = {"member_id", "reply_id"})
        }
)
public class ReplyReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reply_id", nullable = false)
    private Reply reply;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_type", nullable = false, length = 20)
    private ReportReasonType reasonType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static ReplyReport create(Member member, Reply reply, ReportReasonType reasonType) {
        ReplyReport report = new ReplyReport();
        report.member = member;
        report.reply = reply;
        report.reasonType = reasonType;
        return report;
    }
}
