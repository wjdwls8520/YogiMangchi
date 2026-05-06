package com.yogimangchi.domain.real.repository;

import com.yogimangchi.domain.real.dto.request.TransferHistorySearchCondition;
import com.yogimangchi.domain.real.entity.TransferHistory;

import java.util.List;

public interface TransferHistoryRepositoryCustom {

    // 사용자의 이체 내역을 커서 기반 무한 스크롤로 조회
    List<TransferHistory> findTransferHistories(Long memberId, TransferHistorySearchCondition condition);
}
