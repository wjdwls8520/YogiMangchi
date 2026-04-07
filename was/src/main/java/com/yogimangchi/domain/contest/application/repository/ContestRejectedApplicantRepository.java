package com.yogimangchi.domain.contest.application.repository;

import com.yogimangchi.domain.contest.application.entity.ContestRejectedApplicant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContestRejectedApplicantRepository extends JpaRepository<ContestRejectedApplicant, Long>, ContestRejectedApplicantRepositoryCustom {
}
