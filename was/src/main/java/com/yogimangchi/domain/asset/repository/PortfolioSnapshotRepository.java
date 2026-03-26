package com.yogimangchi.domain.asset.repository;

import com.yogimangchi.domain.asset.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot,Long> {
}
