package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.member.dto.query.FollowMemberQueryDto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminContestRepository extends JpaRepository<ContestSeason, Long> {

}

