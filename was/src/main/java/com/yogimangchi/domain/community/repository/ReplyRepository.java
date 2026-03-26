package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.entity.Reply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReplyRepository extends JpaRepository<Reply, Long> {


    @Query("""
        select new com.yogimangchi.domain.community.dto.response.ReplyDetailDto(
            r.id,
            r.content,
            r.likeCount,
            r.replyCount,
            null,
            null,
            null,
            r.createdAt,
            r.updatedAt,
            m.id,
            m.nickname,
            m.profileImgUrl,
            p.id
        )
        from Reply r
        join r.member m
        join r.post p
        where r.deleteYn = 'N'
          and p.id = :postId
          and r.parentReply is null
    """)
    Page<ReplyDetailDto> findAllParentReplys(@Param("postId") Long postId, Pageable pageable);

    @Query("""
        select new com.yogimangchi.domain.community.dto.response.ReplyDetailDto(
            r.id,
            r.content,
            r.likeCount,
            r.replyCount,
            rp.id,
            tm.id,
            tm.nickname,
            r.createdAt,
            r.updatedAt,
            m.id,
            m.nickname,
            m.profileImgUrl,
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
}
