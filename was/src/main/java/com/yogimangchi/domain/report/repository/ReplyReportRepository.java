package com.yogimangchi.domain.report.repository;

import com.yogimangchi.domain.report.entity.ReplyReport;
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
}
