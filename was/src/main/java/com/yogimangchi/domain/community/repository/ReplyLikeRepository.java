package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.entity.ReplyLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReplyLikeRepository extends JpaRepository<ReplyLike, Long> {

    boolean existsByMember_IdAndReply_Id(Long memberId, Long replyId);

    @Query("""
        select rl.reply.id
        from ReplyLike rl
        where rl.member.id = :memberId
          and rl.reply.id in :replyIds
    """)
    List<Long> findLikedReplyIds(@Param("memberId") Long memberId, @Param("replyIds") List<Long> replyIds);

    @Modifying
    @Query(value = """
        insert into reply_like (member_id, reply_id, created_at)
        values (:memberId, :replyId, now())
        on conflict (member_id, reply_id) do nothing
    """, nativeQuery = true)
    int insertIgnore(@Param("memberId") Long memberId, @Param("replyId") Long replyId);

    @Modifying
    @Query("""
        delete from ReplyLike rl
        where rl.member.id = :memberId
          and rl.reply.id = :replyId
    """)
    int deleteByMemberIdAndReplyId(@Param("memberId") Long memberId, @Param("replyId") Long replyId);
}
