package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Query("""
        SELECT new com.yogimangchi.domain.community.dto.response.PostAndMemberDto(
            p.id,
            p.title,
            p.content,
            p.likeCount,
            p.replyCount,
            null,
            p.createdAt,
            p.updatedAt,
            m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl
        )
        FROM Post p
        JOIN p.member m
        WHERE p.deleteYn = 'N'
            AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<PostAndMemberDto> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
        SELECT new com.yogimangchi.domain.community.dto.response.PostAndMemberDto(
            p.id,
            p.title,
            p.content,
            p.likeCount,
            p.replyCount,
            null,
            p.createdAt,
            p.updatedAt,
            m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl
        )
        FROM Post p
        JOIN p.member m
        WHERE p.deleteYn = 'N'
    """)
    Page<PostAndMemberDto> findAllPosts(Pageable pageable);

    @Query("""
        SELECT new com.yogimangchi.domain.community.dto.response.PostAndMemberDto(
            p.id,
            p.title,
            p.content,
            p.likeCount,
            p.replyCount,
            null,
            p.createdAt,
            p.updatedAt,
            m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl
        )
        FROM Post p
        JOIN p.member m
        WHERE p.deleteYn = 'N'
            AND m.id =:authorMemberId
            AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
    """)
    Page<PostAndMemberDto> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCaseByAuthor(@Param("authorMemberId") Long authorMemberId, @Param("keyword") String keyword, Pageable pageable);

    @Query("""
        SELECT new com.yogimangchi.domain.community.dto.response.PostAndMemberDto(
            p.id,
            p.title,
            p.content,
            p.likeCount,
            p.replyCount,
            null,
            p.createdAt,
            p.updatedAt,
            m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl
        )
        FROM Post p
        JOIN p.member m
        WHERE p.deleteYn = 'N' AND m.id =:authorMemberId
    """)
    Page<PostAndMemberDto> findAllPostsByAuthor(@Param("authorMemberId") Long authorMemberId, Pageable pageable);

    @Modifying
    @Query("update Post p set p.replyCount = p.replyCount + 1 where p.id = :postId")
    void increaseReplyCount(@Param("postId") Long postId);

    @Modifying
    @Query("update Post p set p.replyCount = p.replyCount - 1 where p.id = :postId AND p.replyCount > 0")
    void decreaseReplyCount(@Param("postId") Long postId);

    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount + 1 where p.id = :postId")
    void increaseLikeCount(@Param("postId") Long postId);

    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount - 1 where p.id = :postId AND p.likeCount > 0")
    void decreaseLikeCount(@Param("postId") Long postId);

    @Query("select p.likeCount from Post p where p.id = :postId")
    Long findLikeCountById(@Param("postId") Long postId);

    @Modifying
    @Query("update Post p set p.reportCount = p.reportCount + 1 where p.id = :postId")
    void increaseReportCount(@Param("postId") Long postId);

    @Modifying
    @Query("update Post p set p.reportCount = p.reportCount - 1 where p.id = :postId AND p.reportCount > 0")
    void decreaseReportCount(@Param("postId") Long postId);

    @Query("select p.reportCount from Post p where p.id = :postId")
    Long findReportCountById(@Param("postId") Long postId);
}
