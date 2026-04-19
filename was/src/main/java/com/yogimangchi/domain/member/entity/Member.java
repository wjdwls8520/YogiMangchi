package com.yogimangchi.domain.member.entity;

import com.yogimangchi.domain.member.enums.MemberRole;
import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.Comment;
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

    @Column(name = "profile_img_url", length = 1000)
    private String profileImgUrl;

    @Column(name = "profile_msg", length = 255)
    private String profileMsg;

    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private MemberRole role;

    // 나를 팔로우하는 사람 수
    @Column(name = "follower_count", nullable = false)
    private Long followerCount;

    // 내가 팔로윙하는 사람 수
    @Column(name = "following_count", nullable = false)
    private Long followingCount;

    @Column(name = "best_count", nullable = false)
    private Long bestCount;

    @Column(name = "term_agree", nullable = false)
    private boolean termAgree;

    @Column(name = "private_agree", nullable = false)
    private boolean privateAgree;

    @Column(name = "delete_yn", nullable = false, length = 1, columnDefinition = "varchar(1) default 'N'")
    private String deleteYn = "N";

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

    @Column(length = 255)
    private String address1;

    @Column(length = 255)
    private String address2;

    protected Member() {
    }

    public static Member createSocialMember(
            String nickname,
            String profileImgUrl,
            String profileMsg,
            boolean termAgree,
            boolean privateAgree
    ) {
        Member member = new Member();
        member.nickname = nickname;
        member.profileImgUrl = profileImgUrl;
        member.role = MemberRole.USER;
        member.profileMsg = profileMsg;
        member.bestCount = 0L;
        member.followerCount = 0L;
        member.followingCount = 0L;
        member.termAgree = termAgree;
        member.privateAgree = privateAgree;
        member.deleteYn = "N";
        return member;
    }

    public void updateBasicProfile(String nickname, String profileImgUrl, String profileMsg) {
        this.nickname = nickname;
        this.profileImgUrl = profileImgUrl;
        this.profileMsg = profileMsg;
    }

    public void withdraw(String withdrawnNickname, String withdrawnProfileImgUrl) {
        this.deleteYn = "Y";
        this.nickname = withdrawnNickname;
        this.profileImgUrl = withdrawnProfileImgUrl;
        this.profileMsg = null;
        this.followerCount = 0L;
        this.followingCount = 0L;
    }

    public boolean isDeleted() {
        return "Y".equals(this.deleteYn);
    }



    public void verifyWithInfo(String phoneNumber, String addressCode, String address1, String address2) {
        this.role = MemberRole.VERIFIED_USER;
        this.phoneNumber = phoneNumber;
        this.addressCode = addressCode;
        this.address1 = address1;
        this.address2 = address2;
    }

    public void updateVerifiedInfo(String phoneNumber, String addressCode, String address1, String address2) {
        this.phoneNumber = phoneNumber;
        this.addressCode = addressCode;
        this.address1 = address1;
        this.address2 = address2;
    }
}
