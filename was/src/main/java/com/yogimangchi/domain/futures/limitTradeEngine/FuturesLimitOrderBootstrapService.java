package com.yogimangchi.domain.futures.limitTradeEngine;

import com.yogimangchi.domain.futures.dto.query.FuturesPendingSymbolCountDto;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 서버 재시작 시 인메모리 Registry 복원 서비스
 *
 * 서버가 내려간 사이에도 DB에는 PENDING 지정가 주문이 남아있다.
 * ApplicationReadyEvent 시점에 단일 GROUP BY 쿼리로 심볼별 PENDING 카운트를
 * 일괄 조회해 Registry 에 복원하고 스케줄러를 가동해 체결 감시를 재개한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FuturesLimitOrderBootstrapService {

    private final FuturesOrderRepository futuresOrderRepository;
    private final FuturesLimitOrderRegistry limitOrderRegistry;
    private final FuturesLimitOrderScheduler limitOrderScheduler;

    // 서버 기동 완료 후 PENDING 지정가 주문 심볼 복원
    @EventListener(ApplicationReadyEvent.class)
    public void restoreOnStartup() {
        // 단일 쿼리로 (symbol, count) 튜플만 조회 — 엔티티 로드 없음
        List<FuturesPendingSymbolCountDto> counts =
                futuresOrderRepository.findPendingLimitOrderCountsGroupBySymbol();

        if (counts.isEmpty()) {
            log.info("[지정가 Bootstrap] 복원할 PENDING 주문 없음");
            return;
        }

        for (FuturesPendingSymbolCountDto dto : counts) {
            limitOrderRegistry.registerCount(dto.symbol(), dto.count().intValue());
        }

        limitOrderScheduler.refreshSchedule();
        log.info("[지정가 Bootstrap] 복원 완료 — symbols={}",
                counts.stream().map(FuturesPendingSymbolCountDto::symbol).toList());
    }
}
