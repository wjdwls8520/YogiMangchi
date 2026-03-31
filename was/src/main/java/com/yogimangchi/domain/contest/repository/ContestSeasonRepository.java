package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContestSeasonRepository extends JpaRepository<ContestSeason, Long> {
    Optional<ContestSeason> findTopByStatusInOrderByContestStartAtDesc(List<ContestSeasonStatus> recruiting);
}
