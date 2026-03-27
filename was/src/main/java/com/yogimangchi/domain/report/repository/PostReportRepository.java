package com.yogimangchi.domain.report.repository;

import com.yogimangchi.domain.report.entity.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {

    boolean existsByMember_IdAndPost_Id(Long memberId, Long postId);

    @Query("""
        select pr.post.id
        from PostReport pr
        where pr.member.id = :memberId
          and pr.post.id in :postIds
    """)
    List<Long> findReportedPostIds(@Param("memberId") Long memberId, @Param("postIds") List<Long> postIds);

    @Modifying
    @Query(value = """
        insert into post_report (member_id, post_id, reason_type, created_at)
        values (:memberId, :postId, :reasonType, now())
        on conflict (member_id, post_id) do nothing
    """, nativeQuery = true)
    int insertIgnore(@Param("memberId") Long memberId, @Param("postId") Long postId, @Param("reasonType") String reasonType);

    @Modifying
    @Query("""
        delete from PostReport pr
        where pr.member.id = :memberId
          and pr.post.id = :postId
    """)
    int deleteByMemberIdAndPostId(@Param("memberId") Long memberId, @Param("postId") Long postId);
}
