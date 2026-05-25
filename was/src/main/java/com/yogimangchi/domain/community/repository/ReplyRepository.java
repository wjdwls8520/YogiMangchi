package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.entity.Reply;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReplyRepository extends JpaRepository<Reply, Long>, ReplyRepositoryCustom {

    @Modifying
    @Query("update Reply r set r.replyCount = r.replyCount + 1 where r.id = :parentId")
    void increaseReplyCount(@Param("parentId") Long parentId);

    @Modifying
    @Query("update Reply r set r.replyCount = r.replyCount - 1 where r.id = :parentId AND r.replyCount > 0")
    void decreaseReplyCount(@Param("parentId") Long parentId);

    @Modifying
    @Query("update Reply r set r.likeCount = r.likeCount + 1 where r.id = :replyId")
    void increaseLikeCount(@Param("replyId") Long replyId);

    @Modifying
    @Query("update Reply r set r.likeCount = r.likeCount - 1 where r.id = :replyId AND r.likeCount > 0")
    void decreaseLikeCount(@Param("replyId") Long replyId);

    @Query("select r.likeCount from Reply r where r.id = :replyId")
    Long findLikeCountById(@Param("replyId") Long replyId);

    @Modifying
    @Query("update Reply r set r.reportCount = r.reportCount + 1 where r.id = :replyId")
    void increaseReportCount(@Param("replyId") Long replyId);

    @Modifying
    @Query("update Reply r set r.reportCount = r.reportCount - 1 where r.id = :replyId AND r.reportCount > 0")
    void decreaseReportCount(@Param("replyId") Long replyId);

    @Query("select r.reportCount from Reply r where r.id = :replyId")
    Long findReportCountById(@Param("replyId") Long replyId);

    // ── 커서 기반 페이징 메서드 (no-offset) ──

    @Query("""
        select new com.yogimangchi.domain.community.dto.response.ReplyDetailDto(
            r.id,
            case when r.deleteYn = 'Y' then '삭제된 댓글입니다.' else r.content end,
            r.likeCount, false, r.reportCount, false, r.replyCount,
            null, null, null, null,
            r.createdAt, r.updatedAt, m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' when r.deleteYn = 'Y' then '알 수 없음' else m.nickname end,
            case when m.deleteYn = 'Y' then m.profileImgUrl when r.deleteYn = 'Y' then '/images/profile/widthdrawn_profile.png' else m.profileImgUrl end,
            p.id,
            r.deleteYn
        )
        from Reply r
        join r.member m
        join r.post p
        where p.id = :postId
          and p.deleteYn = 'N'
          and r.parentReply is null
          and (:cursorId is null or r.id < :cursorId)
        order by r.id desc
    """)
    List<ReplyDetailDto> findAllParentReplysByCursor(@Param("postId") Long postId, @Param("cursorId") Long cursorId, Pageable pageable);

    @Query("""
        select new com.yogimangchi.domain.community.dto.response.ReplyDetailDto(
            r.id,
            case when r.deleteYn = 'Y' then '삭제된 댓글입니다.' else r.content end,
            r.likeCount,
            false,
            r.reportCount,
            false,
            r.replyCount,
            rp.id,
            tr.id,
            tm.id,
            case when tm.deleteYn = 'Y' then '탈퇴한 유저' when tr.deleteYn = 'Y' then '알 수 없음' else tm.nickname end,
            r.createdAt, r.updatedAt, m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' when r.deleteYn = 'Y' then '알 수 없음' else m.nickname end,
            case when m.deleteYn = 'Y' then m.profileImgUrl when r.deleteYn = 'Y' then '/images/profile/widthdrawn_profile.png' else m.profileImgUrl end,
            p.id,
            r.deleteYn
        )
        from Reply r
        join r.parentReply rp
        left join r.targetReply tr
        left join tr.member tm
        join r.member m
        join r.post p
        where p.id = :postId
          and p.deleteYn = 'N'
          and rp.id = :parentId
          and (:cursorId is null or r.id > :cursorId)
        order by r.id asc
    """)
    // 대댓글은 오래된 글이 위, 최신 글이 아래로 쌓이도록 ASC 정렬을 사용합니다.
    // (지명 기능의 대화 흐름이 자연스럽도록 의도된 정렬이며,
    //  ASC 정렬에서는 페이지 마지막 id가 페이지 내 최대 id가 되므로
    //  다음 페이지는 r.id > :cursorId 로 더 최신 글을 가져와야 합니다.)
    List<ReplyDetailDto> findAllChildrenReplysByCursor(@Param("postId") Long postId, @Param("parentId") Long parentId, @Param("cursorId") Long cursorId, Pageable pageable);

    @Query("""
        select new com.yogimangchi.domain.community.dto.response.ReplyDetailDto(
            r.id,
            r.content,
            r.likeCount, false, r.reportCount, false, r.replyCount,
            rp.id,
            tr.id,
            tm.id,
            case when tm.deleteYn = 'Y' then '탈퇴한 유저' when tr.deleteYn = 'Y' then '알 수 없음' else tm.nickname end,
            r.createdAt, r.updatedAt, m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl,
            p.id,
            r.deleteYn
        )
        from Reply r
        left join r.parentReply rp
        left join r.targetReply tr
        left join tr.member tm
        join r.member m
        join r.post p
        where p.deleteYn = 'N' AND r.deleteYn = 'N' AND m.id = :authorMemberId
          and (:cursorId is null or r.id < :cursorId)
        order by r.id desc
    """)
    List<ReplyDetailDto> getReplysByAuthorByCursor(@Param("authorMemberId") Long authorMemberId, @Param("cursorId") Long cursorId, Pageable pageable);

}
