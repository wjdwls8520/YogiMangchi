package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.entity.Member;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    @Query("""
        select m
        from Member m
        where m.id = :memberId
          and m.deleteYn = 'N'
    """)
    Optional<Member> findActiveById(@Param("memberId") Long memberId);

    boolean existsByNickname(String nickname);

    boolean existsByNicknameAndIdNot(String nickname, Long id);

    @Query(value = """
        select pg_advisory_xact_lock(hashtext(:nickname))
    """, nativeQuery = true)
    void lockNickname(@Param("nickname") String nickname);

    // 동시성 방어를 위해 조회 시 Member row에 DB Lock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select m
        from Member m
        where m.id = :id
          and m.deleteYn = 'N'
    """)
    Optional<Member> findByIdForUpdate(@Param("id") Long memberId);

    @Query("""
        select m.followerCount
        from Member m
        where m.id = :memberId
    """)
    Long findFollowerCountById(@Param("memberId") Long memberId);

    @Modifying
    @Query("""
        update Member m
        set m.followerCount = m.followerCount + 1
        where m.id = :memberId
    """)
    void increaseFollowerCount(@Param("memberId") Long memberId);

    @Modifying
    @Query("""
        update Member m
        set m.followerCount = m.followerCount - 1
        where m.id = :memberId
    """)
    void decreaseFollowerCount(@Param("memberId") Long memberId);

    @Modifying
    @Query("""
        update Member m
        set m.followingCount = m.followingCount + 1
        where m.id = :memberId
    """)
    void increaseFollowingCount(@Param("memberId") Long memberId);

    @Modifying
    @Query("""
        update Member m
        set m.followingCount = m.followingCount - 1
        where m.id = :memberId
    """)
    void decreaseFollowingCount(@Param("memberId") Long memberId);

    @Modifying
    @Query(value = """
        update member
        set follower_count = greatest(follower_count - 1, 0)
        where id in (
            select following_id
            from member_follow
            where follower_id = :memberId
        )
    """, nativeQuery = true)
    void decreaseFollowerCountForWithdraw(@Param("memberId") Long memberId);

    @Modifying
    @Query(value = """
        update member
        set following_count = greatest(following_count - 1, 0)
        where id in (
            select follower_id
            from member_follow
            where following_id = :memberId
        )
    """, nativeQuery = true)
    void decreaseFollowingCountForWithdraw(@Param("memberId") Long memberId);
}
