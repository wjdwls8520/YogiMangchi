package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.futures.dto.query.FuturesOpenPositionSymbolCountDto;
import com.yogimangchi.domain.futures.dto.query.FuturesPendingSymbolCountDto;
import com.yogimangchi.domain.futures.limitTradeEngine.FuturesLimitOrderRegistry;
import com.yogimangchi.domain.futures.limitTradeEngine.FuturesLimitOrderScheduler;
import com.yogimangchi.domain.futures.liquidation.FuturesLiquidationRegistry;
import com.yogimangchi.domain.futures.liquidation.FuturesLiquidationScheduler;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 대회 정산 시 인메모리 감시 카운트를 DB 기준으로 동기화하는 서비스
 *
 * 정산 흐름에서 스냅샷 캡처 직후, 지갑 비활성화/포지션 청산 이전에 호출된다.
 *
 * 해당 시즌의 PENDING 지정가 주문 수와 OPEN 포지션 수를 심볼별로 조회한 뒤
 * 각각의 Registry에서 그만큼 차감한다.
 *
 * 왜 이 시점인가?
 *   - contestEndAt 동기화가 선행되어 해당 시즌의 신규 거래가 차단된 상태 → DB 카운트가 최종값
 *   - 아직 settleClose() 전이므로 OPEN 포지션이 DB에 그대로 남아있어 정확한 카운트 조회 가능
 *
 * 동시성 안전성
 *   - Registry의 ConcurrentHashMap + AtomicInteger로 원자적 차감
 *   - 차감 결과가 0 이하면 자동으로 키 제거 (음수 방어 내장)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestSettlementRegistrySynchronizer {

    private final FuturesOrderRepository futuresOrderRepository;
    private final FuturesPositionRepository futuresPositionRepository;

    private final FuturesLimitOrderRegistry limitOrderRegistry;
    private final FuturesLiquidationRegistry liquidationRegistry;

    private final FuturesLimitOrderScheduler limitOrderScheduler;
    private final FuturesLiquidationScheduler liquidationScheduler;

    /**
     * 해당 시즌의 인메모리 감시 카운트를 차감하고 스케줄러 상태를 갱신한다.
     *
     * @param seasonId 정산 대상 시즌 ID
     * @return 차감한 총 건수 (미체결 주문 + 오픈 포지션)
     */
    @Transactional(readOnly = true)
    public int synchronize(Long seasonId) {
        int totalDeregistered = 0;

        // 1) 해당 시즌의 PENDING 지정가 주문 — 심볼별 카운트 조회 (단일 GROUP BY 쿼리)
        List<FuturesPendingSymbolCountDto> pendingCounts =
                futuresOrderRepository.findPendingLimitOrderCountsByContestSeason(seasonId);

        for (FuturesPendingSymbolCountDto dto : pendingCounts) {
            int count = dto.count().intValue();
            limitOrderRegistry.deregister(dto.symbol(), count);
            totalDeregistered += count;
        }

        // 2) 해당 시즌의 OPEN 포지션 — 심볼별 카운트 조회 (단일 GROUP BY 쿼리)
        List<FuturesOpenPositionSymbolCountDto> positionCounts =
                futuresPositionRepository.findOpenPositionCountsByContestSeason(seasonId);

        for (FuturesOpenPositionSymbolCountDto dto : positionCounts) {
            int count = dto.count().intValue();
            liquidationRegistry.deregister(dto.symbol(), count);
            totalDeregistered += count;
        }

        // 3) 감시 대상이 사라졌으면 스케줄러 중지
        limitOrderScheduler.stopIfIdle();
        liquidationScheduler.stopIfIdle();

        log.info("[정산 Registry 동기화] seasonId={}, 미체결주문={}건({}심볼), 오픈포지션={}건({}심볼)",
                seasonId,
                pendingCounts.stream().mapToLong(FuturesPendingSymbolCountDto::count).sum(),
                pendingCounts.size(),
                positionCounts.stream().mapToLong(FuturesOpenPositionSymbolCountDto::count).sum(),
                positionCounts.size());

        return totalDeregistered;
    }
}
