package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.dto.query.FuturesOrderQueryDto;
import com.yogimangchi.domain.futures.dto.request.FuturesClosedPositionSearchConditionDto;
import com.yogimangchi.domain.futures.dto.request.FuturesOrderSearchConditionDto;
import com.yogimangchi.domain.futures.dto.response.ContestFuturesWalletStatusResponseDto;
import com.yogimangchi.domain.futures.dto.response.FuturesCursorResponseDto;
import com.yogimangchi.domain.futures.dto.response.FuturesOrderResponseDto;
import com.yogimangchi.domain.futures.dto.response.FuturesPositionResponseDto;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import com.yogimangchi.domain.futures.support.FuturesWalletReader;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FuturesQueryService {

    private final FuturesWalletReader futuresWalletReader;
    private final FuturesOrderRepository futuresOrderRepository;
    private final FuturesPositionRepository futuresPositionRepository;

    // 주문 내역 조회 — 체결/미체결 통합, 커서 방식 무한스크롤
    @Transactional(readOnly = true)
    public FuturesCursorResponseDto<FuturesOrderResponseDto> getOrders(
            Long memberId, Long contestSeasonId, FuturesOrderSearchConditionDto condition) {

        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getReadableRealWallet(memberId)
                : futuresWalletReader.getReadableContestWallet(memberId, contestSeasonId);

        List<FuturesOrderQueryDto> orders = futuresOrderRepository.searchOrders(wallet.getId(), condition);

        int limitSize = condition.getOrDefaultSize();
        boolean hasNext = orders.size() > limitSize;

        if (hasNext) {
            orders.remove(limitSize);
        }

        Long nextCursorId = orders.isEmpty() ? null : orders.get(orders.size() - 1).orderId();

        List<FuturesOrderResponseDto> content = orders.stream()
                .map(FuturesOrderResponseDto::from)
                .toList();

        return new FuturesCursorResponseDto<>(content, nextCursorId, hasNext);
    }

    // OPEN 포지션 조회 — 해당 지갑의 모든 OPEN 포지션 (커서 없음, 최대 보유량이 적음)
    @Transactional(readOnly = true)
    public List<FuturesPositionResponseDto> getOpenPositions(Long memberId, Long contestSeasonId) {

        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getReadableRealWallet(memberId)
                : futuresWalletReader.getReadableContestWallet(memberId, contestSeasonId);

        return futuresPositionRepository
                .findAllByAssetsAndPositionStatus(wallet, PositionStatus.OPEN)
                .stream()
                .map(FuturesPositionResponseDto::from)
                .toList();
    }

    // CLOSE 포지션 내역 조회 — 커서 방식 무한스크롤, 선택적 심볼 필터
    @Transactional(readOnly = true)
    public FuturesCursorResponseDto<FuturesPositionResponseDto> getClosedPositions(
            Long memberId, Long contestSeasonId, FuturesClosedPositionSearchConditionDto condition) {

        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getReadableRealWallet(memberId)
                : futuresWalletReader.getReadableContestWallet(memberId, contestSeasonId);

        int limitSize = condition.getOrDefaultSize();
        String symbol = condition.symbol() != null ? condition.symbol().trim().toUpperCase() : null;

        List<com.yogimangchi.domain.futures.entity.FuturesPosition> positions =
                futuresPositionRepository.findClosedPositionsWithCursor(
                        wallet,
                        PositionStatus.CLOSE,
                        symbol,
                        condition.cursorId(),
                        PageRequest.of(0, limitSize + 1)
                );

        boolean hasNext = positions.size() > limitSize;
        if (hasNext) {
            positions.remove(limitSize);
        }

        Long nextCursorId = positions.isEmpty() ? null : positions.get(positions.size() - 1).getId();

        List<FuturesPositionResponseDto> content = positions.stream()
                .map(FuturesPositionResponseDto::from)
                .toList();

        return new FuturesCursorResponseDto<>(content, nextCursorId, hasNext);
    }

    // 대회 선물 지갑 상태 조회 — 현재 잔고 + 사용 중인 증거금(마진) 합산
    @Transactional(readOnly = true)
    public ContestFuturesWalletStatusResponseDto getContestWalletStatus(Long memberId, Long contestSeasonId) {

        Assets wallet = futuresWalletReader.getReadableContestWallet(memberId, contestSeasonId);

        BigDecimal marginInUse = futuresPositionRepository
                .sumTotalMarginByAssetsAndPositionStatus(wallet, PositionStatus.OPEN);

        return ContestFuturesWalletStatusResponseDto.of(wallet, marginInUse);
    }
}
