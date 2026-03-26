package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    boolean existsByMember_IdAndPost_Id(Long memberId, Long postId);

    @Query("""
        select pl.post.id
        from PostLike pl
        where pl.member.id = :memberId
          and pl.post.id in :postIds
    """)
    List<Long> findLikedPostIds(@Param("memberId") Long memberId, @Param("postIds") List<Long> postIds);

    @Modifying
    @Query(value = """
        insert into post_like (member_id, post_id, created_at)
        values (:memberId, :postId, now())
        on conflict (member_id, post_id) do nothing
    """, nativeQuery = true)
    int insertIgnore(@Param("memberId") Long memberId, @Param("postId") Long postId);

    @Modifying
    @Query("""
        delete from PostLike pl
        where pl.member.id = :memberId
          and pl.post.id = :postId
    """)
    int deleteByMemberIdAndPostId(@Param("memberId") Long memberId, @Param("postId") Long postId);
}
