package com.yogimangchi.domain.report.repository;

import com.yogimangchi.domain.report.dto.query.MyReportedPostQueryDto;
import com.yogimangchi.domain.report.entity.PostReport;
import org.springframework.data.domain.Pageable;
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


    // ── 커서 기반 페이징 메서드 (no-offset) ──

    @Query("""
        select new com.yogimangchi.domain.report.dto.query.MyReportedPostQueryDto(
            pr.id,
            p.id, p.title, p.content, p.likeCount, p.replyCount, p.reportCount,
            p.createdAt, p.updatedAt, m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl,
            pr.reasonType
        )
        from PostReport pr
        join pr.post p
        join p.member m
        where pr.member.id = :loginMemberId
          and p.deleteYn = 'N'
          and (:cursorId is null or pr.id < :cursorId)
        order by pr.id desc
    """)
    List<MyReportedPostQueryDto> findReportedPostsByCursor(@Param("loginMemberId") Long loginMemberId, @Param("cursorId") Long cursorId, Pageable pageable);

    @Query("""
        select new com.yogimangchi.domain.report.dto.query.MyReportedPostQueryDto(
            pr.id,
            p.id, p.title, p.content, p.likeCount, p.replyCount, p.reportCount,
            p.createdAt, p.updatedAt, m.id,
            case when m.deleteYn = 'Y' then '탈퇴한 유저' else m.nickname end,
            m.profileImgUrl,
            pr.reasonType
        )
        from PostReport pr
        join pr.post p
        join p.member m
        where pr.member.id = :loginMemberId
          and p.deleteYn = 'N'
          and (:cursorId is null or pr.id < :cursorId)
          and (
              lower(p.title) like lower(concat('%', :keyword, '%'))
              or lower(p.content) like lower(concat('%', :keyword, '%'))
          )
        order by pr.id desc
    """)
    List<MyReportedPostQueryDto> findReportedPostsByKeywordByCursor(@Param("loginMemberId") Long loginMemberId, @Param("cursorId") Long cursorId, @Param("keyword") String keyword, Pageable pageable);
}
