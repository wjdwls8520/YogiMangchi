package com.yogimangchi.domain.community.entity;

import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(
        name = "reply_like",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_reply_like_member_reply", columnNames = {"member_id", "reply_id"})
        }
)
public class ReplyLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reply_id", nullable = false)
    private Reply reply;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static ReplyLike create(Member member, Reply reply) {
        ReplyLike replyLike = new ReplyLike();
        replyLike.member = member;
        replyLike.reply = reply;
        return replyLike;
    }
}
