package com.yogimangchi.domain.community.entity;

import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;


@Entity
@Getter
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, length = 50)
    private String title;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(name = "like_count", nullable = false, columnDefinition = "bigint default 0")
    private Long likeCount = 0L;

    @Column(name = "reply_count", nullable = false, columnDefinition = "bigint default 0")
    private Long replyCount = 0L;

    @Column(name = "report_count", nullable = false, columnDefinition = "bigint default 0")
    private Long reportCount = 0L;

    @Column(name = "delete_yn", nullable = false, length = 1, columnDefinition = "varchar(1) default 'N'")
    private String deleteYn = "N"; // y삭제상태, n정상상태

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static Post create(Member member, String title, String content) {
        Post post = new Post();
        post.member = member;
        post.title = title;
        post.content = content;
        post.likeCount = 0L;
        post.replyCount = 0L;
        post.reportCount = 0L;
        post.deleteYn = "N";
        return post;
    }

    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }
}
