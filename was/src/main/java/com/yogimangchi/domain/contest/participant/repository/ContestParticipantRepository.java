package com.yogimangchi.domain.contest.participant.repository;

import com.yogimangchi.domain.contest.participant.entity.ContestParticipant;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, Long>, ContestParticipantRepositoryCustom {

    boolean existsByMemberAndContestSeason(Member member, ContestSeason contestSeason);

    @Query("""
        select contestParticipant.contestSeason.id
        from ContestParticipant contestParticipant
        where contestParticipant.member.id = :memberId
          and contestParticipant.contestSeason.id in :seasonIds
    """)
    List<Long> findParticipatingSeasonIds(@Param("memberId") Long memberId, @Param("seasonIds") List<Long> seasonIds);
}
