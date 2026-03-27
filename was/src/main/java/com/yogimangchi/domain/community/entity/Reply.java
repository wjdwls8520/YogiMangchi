package com.yogimangchi.domain.community.entity;

import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
public class Reply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String content;

    @Column(name = "like_count", nullable = false, columnDefinition = "bigint default 0")
    private Long likeCount = 0L;

    @Column(name = "reply_count", nullable = false, columnDefinition = "bigint default 0")
    private Long replyCount = 0L;

    @Column(name = "report_count", nullable = false, columnDefinition = "bigint default 0")
    private Long reportCount = 0L;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(name = "delete_yn", nullable = false, length = 1, columnDefinition = "varchar(1) default 'N'")
    private String deleteYn = "N"; // y삭제상태, n정상상태

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Reply parentReply;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_reply_id")
    private Reply targetReply; // 실제 답글 대상 댓글

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    public static Reply create(String content, Member member, Post post) {
        Reply reply = new Reply();
        reply.content = content;
        reply.member = member;
        reply.post = post;
        reply.likeCount = 0L;
        reply.replyCount = 0L;
        reply.deleteYn = "N";
        return reply;
    }

    public static Reply createChild(String content, Reply parentReply, Reply targetReply, Member member, Post post) {
        Reply reply = new Reply();
        reply.content = content;
        reply.parentReply = parentReply;
        reply.targetReply = targetReply;
        reply.member = member;
        reply.post = post;
        reply.likeCount = 0L;
        reply.replyCount = 0L;
        reply.deleteYn = "N";
        return reply;
    }

    public Reply update(String content) {
        this.content = content;
        return this;
    }

    public void delete() {
        this.deleteYn = "Y";
    }
}
