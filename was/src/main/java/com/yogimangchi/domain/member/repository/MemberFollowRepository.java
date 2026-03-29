package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.entity.MemberFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberFollowRepository extends JpaRepository<MemberFollow, Long>, MemberFollowRepositoryCustom {

    boolean existsByFollower_IdAndFollowing_Id(Long followerId, Long followingId);

    @Modifying
    @Query(value = """
        insert into member_follow (follower_id, following_id, created_at)
        values (:followerId, :followingId, now())
        on conflict (follower_id, following_id) do nothing
    """, nativeQuery = true)
    int insertIgnore(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    @Modifying
    @Query("""
        delete from MemberFollow mf
        where mf.follower.id = :followerId
          and mf.following.id = :followingId
    """)
    int deleteByFollowerIdAndFollowingId(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    @Modifying
    @Query("""
        delete from MemberFollow mf
        where mf.follower.id = :memberId
           or mf.following.id = :memberId
    """)
    int deleteAllByMemberId(@Param("memberId") Long memberId);
}
