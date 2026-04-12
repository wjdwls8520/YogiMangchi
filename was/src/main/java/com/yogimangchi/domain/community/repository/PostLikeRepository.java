package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.dto.query.PostQueryDto;
import com.yogimangchi.domain.community.entity.PostLike;
import org.springframework.data.domain.Pageable;
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



    // ── 커서 기반 페이징 메서드 (no-offset) ──
    @Query("""
        select new com.yogimangchi.domain.community.dto.query.PostQueryDto(
            pl.id,
            p.id, p.title, p.content, p.likeCount, p.replyCount, p.reportCount,
            p.createdAt, p.updatedAt, m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl
        )
        from PostLike pl
        join pl.post p
        join p.member m
        where pl.member.id = :loginMemberId
          and p.deleteYn = 'N'
          and (:cursorId is null or pl.id < :cursorId)
        order by pl.id desc
    """)
    List<PostQueryDto> findLikedPostsByCursor(@Param("loginMemberId") Long loginMemberId, @Param("cursorId") Long cursorId, Pageable pageable);

    @Query("""
        select new com.yogimangchi.domain.community.dto.query.PostQueryDto(
            pl.id,
            p.id, p.title, p.content, p.likeCount, p.replyCount, p.reportCount,
            p.createdAt, p.updatedAt, m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl
        )
        from PostLike pl
        join pl.post p
        join p.member m
        where pl.member.id = :loginMemberId
          and p.deleteYn = 'N'
          and (:cursorId is null or pl.id < :cursorId)
          and (
              lower(p.title) like lower(concat('%', :keyword, '%'))
              or lower(p.content) like lower(concat('%', :keyword, '%'))
          )
        order by pl.id desc
    """)
    List<PostQueryDto> findLikedPostsByKeywordByCursor(@Param("loginMemberId") Long loginMemberId, @Param("cursorId") Long cursorId, @Param("keyword") String keyword, Pageable pageable);

}
