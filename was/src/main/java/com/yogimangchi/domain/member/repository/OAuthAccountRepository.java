package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.dto.response.MyProfileInfoDto;
import com.yogimangchi.domain.member.entity.OAuthAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {
    Optional<OAuthAccount> findByProviderAndProviderUserId(String provider, String providerUserId);

    Optional<OAuthAccount> findByMember_Id(Long memberId);

    @Query("""
        SELECT new com.yogimangchi.domain.member.dto.response.MyProfileInfoDto(
            m.id,
            oa.provider,
            m.nickname,
            m.role,
            m.profileImgUrl,
            m.profileMsg,
            m.bestCount,
            m.followerCount,
            m.followingCount,
            m.termAgree,
            m.privateAgree
        )
        FROM OAuthAccount oa
        JOIN oa.member m
        WHERE m.id = :memberId
          and m.deleteYn = 'N'
    """)
    MyProfileInfoDto findMyProfileInfo(@Param("memberId") Long memberId);
}
