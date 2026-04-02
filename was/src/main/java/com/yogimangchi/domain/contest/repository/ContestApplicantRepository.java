package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.entity.ContestApplicant;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContestApplicantRepository extends JpaRepository<ContestApplicant,Long> {
    boolean existsByMemberAndContestSeason(Member member, ContestSeason latestSeason);
}
