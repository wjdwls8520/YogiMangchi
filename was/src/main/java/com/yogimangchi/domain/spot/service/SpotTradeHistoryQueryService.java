package com.yogimangchi.domain.spot.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.spot.dto.query.TradeHistoryQueryDto;
import com.yogimangchi.domain.spot.dto.request.TradeHistorySearchCondition;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import com.yogimangchi.domain.spot.dto.response.TradeHistoryResponseDto;
import com.yogimangchi.domain.spot.repository.TradeHistoryRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SpotTradeHistoryQueryService {

    private final AssetRepository assetRepository;
    private final TradeHistoryRepository tradeHistoryRepository;

    @Transactional(readOnly = true)
    public CursorResponseDto<TradeHistoryResponseDto> getTradeHistories(Long memberId, TradeHistorySearchCondition cond) {
        Long assetId = null;
        if (cond.assetType() == AssetType.MOCK) {
            assetId = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                    .map(Assets::getId)
                    .orElseThrow(() -> new IllegalArgumentException("현재 참여 중인 모의투자 계좌가 존재하지 않습니다."));
        }

        // QueryDSL 조회 시 다음 페이지 판별을 위해 size + 1건을 가져온다.
        List<TradeHistoryQueryDto> histories = tradeHistoryRepository.searchTradeHistories(memberId, cond, assetId);

        // 다음 페이지 존재 여부를 계산한다.
        int limitSize = cond.getOrDefaultSize();
        boolean hasNext = histories.size() > limitSize;

        // 다음 페이지가 있으면 추가로 조회한 마지막 1건을 제거한다.
        if (hasNext) {
            histories.remove(limitSize);
        }

        // 다음 페이지 조회에 사용할 커서 ID를 계산한다.
        Long nextCursorId = null;
        if (!histories.isEmpty()) {
            nextCursorId = histories.get(histories.size() - 1).tradeId();
        }

        // Query DTO를 응답 DTO로 변환한다.
        List<TradeHistoryResponseDto> content = histories.stream()
                .map(TradeHistoryResponseDto::from)
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }
}
