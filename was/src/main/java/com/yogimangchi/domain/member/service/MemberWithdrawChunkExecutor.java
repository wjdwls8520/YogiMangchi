package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import com.yogimangchi.domain.futures.service.FuturesCurrentPriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * 탈퇴 회원 자산 정리 — 오픈 포지션 청크 실행기
 * 
 * 500개 단위의 청크를 별도 독립 트랜잭션(REQUIRES_NEW)으로 커밋하여 DB 부하를 분산하고 커넥션 풀 고갈을 방지합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberWithdrawChunkExecutor {

    private final FuturesPositionRepository futuresPositionRepository;
    private final FuturesCurrentPriceService futuresCurrentPriceService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int closeChunk(List<Long> positionIds) {
        if (positionIds.isEmpty()) {
            return 0;
        }

        List<FuturesPosition> positions = futuresPositionRepository.findAllById(positionIds);
        int closedCount = 0;

        for (FuturesPosition position : positions) {
            // 멱등 가드 - 이미 청산된 건은 스킵
            if (position.getPositionStatus() != PositionStatus.OPEN) {
                continue;
            }

            // 시세 틱 캐시 조회 (miss 시 진입가 기준 실현손익 0 청산)
            BigDecimal currentPrice = futuresCurrentPriceService.findCurrentPrice(position.getSymbol())
                    .orElse(position.getEntryPrice());

            BigDecimal realizedPnl = calculateRealizedPnl(position, currentPrice);
            position.settleClose(realizedPnl);
            closedCount++;
        }

        return closedCount;
    }

    private BigDecimal calculateRealizedPnl(FuturesPosition position, BigDecimal currentPrice) {
        return switch (position.getPositionSide()) {
            case LONG -> currentPrice.subtract(position.getEntryPrice())
                    .multiply(position.getFilledQuantity())
                    .setScale(8, RoundingMode.HALF_UP);
            case SHORT -> position.getEntryPrice().subtract(currentPrice)
                    .multiply(position.getFilledQuantity())
                    .setScale(8, RoundingMode.HALF_UP);
        };
    }
}
