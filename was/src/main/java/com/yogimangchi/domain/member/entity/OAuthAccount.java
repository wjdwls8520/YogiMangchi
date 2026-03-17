package com.yogimangchi.domain.member.entity;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.Comment;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
public class OAuthAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idx;

    @ManyToOne
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "provider", nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_user_id", nullable = false, length = 100)
    private String providerUserId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    @Comment("sns가 언제 연결되었는지")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
