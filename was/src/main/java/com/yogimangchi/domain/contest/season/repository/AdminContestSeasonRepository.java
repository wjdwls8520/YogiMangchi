package com.yogimangchi.domain.contest.season.repository;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import org.springframework.data.jpa.repository.JpaRepository;


public interface AdminContestSeasonRepository extends JpaRepository<ContestSeason, Long>, AdminContestSeasonRepositoryCustom {

}

