package com.yogimangchi.domain.report.repository;

import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.report.entity.ReplyReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReplyReportRepository extends JpaRepository<ReplyReport, Long> {

    boolean existsByMember_IdAndReply_Id(Long memberId, Long replyId);

    @Query("""
        select rr.reply.id
        from ReplyReport rr
        where rr.member.id = :memberId
          and rr.reply.id in :replyIds
    """)
    List<Long> findReportedReplyIds(@Param("memberId") Long memberId, @Param("replyIds") List<Long> replyIds);

    @Modifying
    @Query(value = """
        insert into reply_report (member_id, reply_id, reason_type, created_at)
        values (:memberId, :replyId, :reasonType, now())
        on conflict (member_id, reply_id) do nothing
    """, nativeQuery = true)
    int insertIgnore(@Param("memberId") Long memberId, @Param("replyId") Long replyId, @Param("reasonType") String reasonType);

    @Modifying
    @Query("""
        delete from ReplyReport rr
        where rr.member.id = :memberId
          and rr.reply.id = :replyId
    """)
    int deleteByMemberIdAndReplyId(@Param("memberId") Long memberId, @Param("replyId") Long replyId);

    @Query("""
        select new com.yogimangchi.domain.community.dto.response.ReplyDetailDto(
            r.id,
            r.content,
            r.likeCount,
            false,
            r.reportCount,
            true,
            r.replyCount,
            rp.id,
            tm.id,
            case
                when tm.deleteYn = 'Y' then '탈퇴한 유저'
                when tr.deleteYn = 'Y' then '알 수 없음'
                else tm.nickname
            end,
            r.createdAt,
            r.updatedAt,
            m.id,
            m.nickname,
            m.profileImgUrl,
            p.id
        )
        from ReplyReport rr
        join rr.reply r
        left join r.parentReply rp
        left join r.targetReply tr
        left join tr.member tm
        join r.member m
        join r.post p
        where rr.member.id = :loginMemberId
          and p.deleteYn = 'N'
          and r.deleteYn = 'N'
    """)
    Page<ReplyDetailDto> getReportedReplys(@Param("loginMemberId") Long loginMemberId, Pageable pageable);
}
