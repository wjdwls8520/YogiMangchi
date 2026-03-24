package com.yogimangchi.global.file.Entity;

import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
public class File {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String originalname;

    @Column(nullable = false, length = 255)
    private Long size;

    @Column(nullable = false, length = 255)
    private String path;

    @Column(nullable = false, length = 255)
    private String contentType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;
}
