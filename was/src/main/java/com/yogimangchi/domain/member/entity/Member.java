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
    private Integer profileImg;

    @Column(name = "profile_msg", length = 255)
    private String profileMsg;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MemberRole role;

    @Column(name = "term_agree", nullable = false)
    private boolean termAgree;

    @Column(name = "private_agree", nullable = false)
    private boolean privateAgree;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "address_code", length = 5)
    private String addressCode;

    @Column(length = 20)
    private String address1;

    @Column(length = 100)
    private String address2;

    protected Member() {
    }

    public static Member createSocialMember(
            String nickname,
            Integer profileImg,
            boolean termAgree,
            boolean privateAgree,
            String profileMsg
    ) {
        Member member = new Member();
        member.nickname = nickname;
        member.profileImg = profileImg;
        member.role = MemberRole.USER;
        member.termAgree = termAgree;
        member.privateAgree = privateAgree;
        member.profileMsg = profileMsg;
        return member;
    }
}
