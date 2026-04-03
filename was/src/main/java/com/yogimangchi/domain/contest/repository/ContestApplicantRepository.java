package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.entity.ContestApplicant;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContestApplicantRepository extends JpaRepository<ContestApplicant,Long>, ContestApplicantRepositoryCustom {
    boolean existsByMemberAndContestSeason(Member member, ContestSeason latestSeason);

    java.util.Optional<ContestApplicant> findByIdAndContestSeasonId(Long applicantId, Long seasonId);

    @Query("""
        select contestApplicant.contestSeason.id
        from ContestApplicant contestApplicant
        where contestApplicant.member.id = :memberId
          and contestApplicant.contestSeason.id in :seasonIds
    """)
    List<Long> findPendingSeasonIds(@Param("memberId") Long memberId, @Param("seasonIds") List<Long> seasonIds);
}
