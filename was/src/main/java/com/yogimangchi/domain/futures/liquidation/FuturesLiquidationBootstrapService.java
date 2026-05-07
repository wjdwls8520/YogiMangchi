package com.yogimangchi.domain.futures.liquidation;

import com.yogimangchi.domain.futures.dto.query.FuturesOpenPositionSymbolCountDto;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 파일명 해석
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Futures    : 선물
 *  Liquidation: 강제청산
 *  Bootstrap  : 부트스트랩 / 초기 적재 / 기동 시 준비 작업
 *               → 신발 끈(bootstrap)을 당겨 신발을 신는다는 비유에서 유래
 *               → 서버가 스스로 기동에 필요한 준비를 수행한다는 의미
 *               → 여기서는 "서버가 재시작되더라도 강제청산 감시 상태를 복원한다"는 뜻
 *  Service    : Spring Service 계층 컴포넌트
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 역할
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  FuturesLiquidationRegistry 는 인메모리 상태이므로 서버가 재시작되면 모든 정보가 초기화된다.
 *  서버가 내려가 있는 동안에도 유저의 OPEN 포지션은 DB에 그대로 남아있다.
 *
 *  따라서 서버 기동 시 DB에서 OPEN 상태인 포지션의 심볼 목록을 조회하여
 *  Registry에 다시 등록하고, Scheduler를 시작시켜야 한다.
 *  이 역할을 담당하는 것이 Bootstrap Service다.
 *
 *  LimitOrderBootstrapService(현물 지정가 부트스트랩)와 동일한 구조이며, 강제청산 전용이다.
 *
 * 처리 흐름
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  @EventListener(ApplicationReadyEvent.class)
 *  → 스프링 컨텍스트가 완전히 로딩된 직후 자동 실행 (서버 기동 완료 시점)
 *
 *  1. FuturesPositionRepository 에서 positionStatus = OPEN 인 포지션들의 심볼 목록 조회
 *     (중복 제거, distinct 쿼리)
 *
 *  2. 조회된 심볼 각각을 FuturesLiquidationRegistry.registerOpenSymbol() 로 등록
 *
 *  3. FuturesLiquidationScheduler.refreshSchedule() 호출
 *     → 등록된 심볼이 있으면 스케줄러 자동 시작
 *
 *  4. 등록된 심볼 수 로그 출력
 *     예) "[강제청산 부트스트랩] OPEN 포지션 심볼 3개 복원: [BTCUSDT, ETHUSDT, BNBUSDT]"
 *
 * 주의사항
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  - @Transactional(readOnly = true) 로 처리 (쓰기 없는 단순 조회)
 *  - 서버 재시작 직후 틱이 오기 전에 스케줄러 fallback이 먼저 감시를 시작해야 하므로
 *    ApplicationReadyEvent 시점에 실행되어야 함
 *  - FuturesPositionRepository 에 distinct 심볼 조회 전용 쿼리를 추가해야 함
 *    예) @Query("SELECT DISTINCT fp.symbol FROM FuturesPosition fp WHERE fp.positionStatus = 'OPEN'")
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FuturesLiquidationBootstrapService {

    // 구현 예정
    //
    // 주입 예정 의존성( BootstrapService가 아래 3파일에 의존함 ):
    //   FuturesPositionRepository    futuresPositionRepository   // DB 조회 담당
    //   FuturesLiquidationRegistry   liquidationRegistry         // 인메모리 등록 담당
    //   FuturesLiquidationScheduler  liquidationScheduler        // 스케줄러 시작 담당
    private final FuturesPositionRepository futuresPositionRepository;
    private final FuturesLiquidationRegistry liquidationRegistry;
    private final FuturesLiquidationScheduler liquidationScheduler;

    // 서버가 완전히 뜬 직후 자동 실행
    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void restoreOpenPositionSymbols() {

        // 단일 GROUP BY 쿼리로 심볼별 OPEN 포지션 카운트 일괄 조회
        // (이전: distinct 심볼 조회 + 심볼당 COUNT 쿼리 = N+1)
        List<FuturesOpenPositionSymbolCountDto> counts =
                futuresPositionRepository.findOpenPositionCountsGroupBySymbol();

        if (counts.isEmpty()) {
            log.info("[강제청산 부트스트랩] 복원할 OPEN 포지션 없음");
            return;
        }

        // 심볼별 카운트 일괄 누적 — register 반복 호출 대신 단일 addAndGet
        for (FuturesOpenPositionSymbolCountDto dto : counts) {
            liquidationRegistry.registerCount(dto.symbol(), dto.count().intValue());
        }

        // 감시할 심볼이 있으면 스케줄러 시작
        liquidationScheduler.refreshSchedule();

        log.info("[강제청산 부트스트랩] OPEN 포지션 심볼 {}개 복원: {}",
                counts.size(),
                counts.stream().map(FuturesOpenPositionSymbolCountDto::symbol).toList());
    }
}
