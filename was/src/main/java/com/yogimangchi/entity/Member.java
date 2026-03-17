package com.yogimangchi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;

@Entity
@Getter
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idx;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(nullable = false, length = 20)
    private String provider;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "provider_user_id", nullable = false, length = 100)
    private String providerUserId;

    @Column(name = "profile_img")
    private Integer profileImg; // file_idx 참조

    @Column(name = "profile_msg", length = 255)
    private String profileMsg;

    @Column(name = "address_code", length = 5)
    private String addressCode;

    @Column(length = 20)
    private String address1;

    @Column(length = 100)
    private String address2;

    @Column(name = "term_agree", columnDefinition = "TINYINT(1)", nullable = false)
    private boolean termAgree; // 0=false, 1=true

    @Column(name = "private_agree", columnDefinition = "TINYINT(1)", nullable = false)
    private boolean privateAgree;

    @Column(nullable = false)
    private Integer role; // 1=회원, 2=인증회원, 3=어드민

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
}
