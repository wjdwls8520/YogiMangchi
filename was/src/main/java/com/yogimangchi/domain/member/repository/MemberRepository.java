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

    boolean existsByNickname(String nickname);

    boolean existsByNicknameAndIdNot(String nickname, Long id);

    // 동시성 방어를 위해 조회 시 Member row에 DB Lock
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Member m WHERE m.id = :id")
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
}
