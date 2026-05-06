package com.yogimangchi.domain.real.repository;

import com.yogimangchi.domain.real.entity.TransferHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface TransferHistoryRepository extends JpaRepository<TransferHistory, Long>, TransferHistoryRepositoryCustom {

    // 멱등성 검증용 requestId 조회
    Optional<TransferHistory> findByRequestId(String requestId);

    // 알림 발송을 위해 fromAsset, toAsset을 한 번에 가져옵니다. (Fetch Join)
    @Query("select th from TransferHistory th " +
            "join fetch th.fromAsset " +
            "join fetch th.toAsset " +
            "where th.id = :id")
    Optional<TransferHistory> findByIdWithAssets(@Param("id") Long id);
}
