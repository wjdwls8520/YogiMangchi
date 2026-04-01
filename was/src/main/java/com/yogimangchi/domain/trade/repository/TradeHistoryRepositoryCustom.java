package com.yogimangchi.domain.trade.repository;

import com.yogimangchi.domain.trade.dto.request.TradeHistorySearchCondition;
import com.yogimangchi.domain.trade.dto.query.TradeHistoryQueryDto;

import java.util.List;

public interface TradeHistoryRepositoryCustom {
    // 무한스크롤 + 동적 필터링 메서드(querydsl)
    List<TradeHistoryQueryDto> searchTradeHistories(Long memberId, TradeHistorySearchCondition cond, Long assetId);
}
