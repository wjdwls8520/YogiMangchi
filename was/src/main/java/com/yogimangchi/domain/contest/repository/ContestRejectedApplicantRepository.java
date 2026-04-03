package com.yogimangchi.domain.contest.repository;

import com.yogimangchi.domain.contest.entity.ContestRejectedApplicant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContestRejectedApplicantRepository extends JpaRepository<ContestRejectedApplicant, Long>, ContestRejectedApplicantRepositoryCustom {
}
