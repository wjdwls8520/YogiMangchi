package com.yogimangchi.domain.spot.repository;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.spot.dto.request.TradeHistorySearchCondition;
import com.yogimangchi.domain.spot.dto.query.TradeHistoryQueryDto;

import java.util.List;

public interface TradeHistoryRepositoryCustom {
    // 무한스크롤 + 동적 필터링 메서드(querydsl)
    List<TradeHistoryQueryDto> searchTradeHistories(Long memberId, AssetType assetType, TradeHistorySearchCondition cond, Long assetId);
}
