package com.yogimangchi.domain.member.entity;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(
        name = "member_follow",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_member_follow_follower_following", columnNames = {"follower_id", "following_id"})
        }
)
public class MemberFollow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "follower_id", nullable = false)
    private Member follower;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "following_id", nullable = false)
    private Member following;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static MemberFollow create(Member follower, Member following) {
        MemberFollow memberFollow = new MemberFollow();
        memberFollow.follower = follower;
        memberFollow.following = following;
        return memberFollow;
    }
}
