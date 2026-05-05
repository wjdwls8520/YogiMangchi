package com.yogimangchi.domain.real.repository;

import com.yogimangchi.domain.real.entity.TransferHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransferHistoryRepository extends JpaRepository<TransferHistory, Long> {

    // 멱등성 검증용 requestId 조회
    Optional<TransferHistory> findByRequestId(String requestId);
}
