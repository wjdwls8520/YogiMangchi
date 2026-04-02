package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.entity.ContestSeason;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContestSeasonRepository extends JpaRepository<ContestSeason, Long>, ContestSeasonRepositoryCustom {
}
