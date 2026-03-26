package com.yogimangchi.domain.community.entity;

import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(
        name = "post_like",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_post_like_member_post", columnNames = {"member_id", "post_id"})
        }
)
public class PostLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static PostLike create(Member member, Post post) {
        PostLike postLike = new PostLike();
        postLike.member = member;
        postLike.post = post;
        return postLike;
    }
}
