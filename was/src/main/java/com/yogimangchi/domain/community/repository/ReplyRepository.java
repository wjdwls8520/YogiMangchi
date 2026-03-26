package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.entity.Reply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReplyRepository extends JpaRepository<Reply, Long> {


    @Query("""
        select new com.yogimangchi.domain.community.dto.response.ReplyDetailDto(
            r.id,
            case when r.deleteYn = 'Y' then '삭제된 댓글입니다.' else r.content end,
            r.likeCount,
            r.replyCount,
            null,
            null,
            null,
            r.createdAt,
            r.updatedAt,
            m.id,
            case when r.deleteYn = 'Y' then '알수없음' else m.nickname end,
            case when r.deleteYn = 'Y' then null else m.profileImgUrl end,
            p.id
        )
        from Reply r
        join r.member m
        join r.post p
        where p.id = :postId
          and r.parentReply is null
    """)
    Page<ReplyDetailDto> findAllParentReplys(@Param("postId") Long postId, Pageable pageable);

    @Query("""
        select new com.yogimangchi.domain.community.dto.response.ReplyDetailDto(
            r.id,
            case when r.deleteYn = 'Y' then '삭제된 댓글입니다.' else r.content end,
            r.likeCount,
            r.replyCount,
            rp.id,
            tm.id,
            tm.nickname,
            r.createdAt,
            r.updatedAt,
            m.id,
            case when r.deleteYn = 'Y' then '알수없음' else m.nickname end,
            case when r.deleteYn = 'Y' then null else m.profileImgUrl end,
            p.id
        )
        from Reply r
        join r.parentReply rp
        left join r.targetReply tr
        left join tr.member tm
        join r.member m
        join r.post p
        where r.deleteYn = 'N'
          and p.id = :postId
          and rp.id = :parentId
    """)
    Page<ReplyDetailDto> findAllChildrenReplys(@Param("postId") Long postId, @Param("parentId") Long parentId, Pageable pageable);

    @Modifying
    @Query("update Reply r set r.replyCount = r.replyCount + 1 where r.id = :parentId")
    void increaseReplyCount(@Param("parentId") Long parentId);

    @Modifying
    @Query("update Reply r set r.replyCount = r.replyCount - 1 where r.id = :parentId AND r.replyCount > 0")
    void decreaseReplyCount(@Param("parentId") Long parentId);
}
