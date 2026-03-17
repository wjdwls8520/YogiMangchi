package com.yogimangchi.domain.member.entity;

import com.yogimangchi.domain.member.enums.MemberRole;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
public class Member {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    @Column(name = "profile_img")
    private Integer profileImg; // file_idx 참조

    @Column(name = "profile_msg", length = 255)
    private String profileMsg;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MemberRole role; // 1=회원, 2=인증회원, 3=어드민

    @Column(name = "term_agree", nullable = false)
    private boolean termAgree; // true false

    @Column(name = "private_agree", nullable = false)
    private boolean privateAgree; // true false

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


    // 본인인증 회원
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "address_code", length = 5)
    private String addressCode;

    @Column(length = 20)
    private String address1;

    @Column(length = 100)
    private String address2;
}
