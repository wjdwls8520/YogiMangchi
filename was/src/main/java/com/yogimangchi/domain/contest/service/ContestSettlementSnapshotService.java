package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.entity.ContestSettlementPriceSnapshot;
import com.yogimangchi.domain.contest.season.repository.ContestSeasonRepository;
import com.yogimangchi.domain.contest.season.repository.ContestSettlementPriceSnapshotRepository;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import com.yogimangchi.domain.futures.service.FuturesCurrentPriceService;
import com.yogimangchi.global.exception.contest.ContestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 대회 시즌 정산 Phase 1 — 가격 스냅샷 캡처 서비스
 *
 * 흐름
 *  1. 시즌 내 OPEN 포지션의 심볼 distinct 목록 조회
 *  2. 각 심볼의 가격을 인메모리 ticker 캐시(FuturesCurrentPriceService)에서 조회
 *  3. 사전 검증 — 한 심볼이라도 가격이 비어있으면 어떤 것도 저장하지 않고 예외 throw
 *     (어드민이 잠시 후 재시도하도록 유도, 부분 저장으로 인한 불완전 상태 회피)
 *  4. (시즌, 심볼) 중복 체크 후 신규만 저장
 *
 * 멱등성 보장
 *  - 같은 (시즌, 심볼) 조합은 unique constraint + existsBy 사전 체크로 중복 저장 방지
 *  - 재호출 시 신규 캡처 수(0 가능)만 반환
 *
 * 캐시 누락 방어 전략 (C 전략)
 *  - REST 폴백 미도입 — TICKER_CACHE 가 비는 시점은 서버 재시작 직후 ~5초 윈도우 뿐
 *  - 정산은 즉시성이 핵심이 아닌 어드민 1회성 작업이므로 실패 시 재시도가 합리적
 *  - 이 5초 안에 정산이 트리거될 가능성은 사실상 0 (스케줄러 발동 시각과 무관, 어드민 클릭 시점도 부팅 직후 < 5초는 비현실적)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestSettlementSnapshotService {

    private final ContestSeasonRepository contestSeasonRepository;
    private final FuturesPositionRepository futuresPositionRepository;
    private final FuturesCurrentPriceService futuresCurrentPriceService;
    private final ContestSettlementPriceSnapshotRepository snapshotRepository;

    /**
     * 시즌의 모든 OPEN 포지션 심볼에 대해 정산 기준가를 박제한다.
     *
     * @param seasonId    정산 대상 시즌 ID
     * @param capturedAt  논리적 캡처 시각 (스케줄러: contestEndAt / 어드민 즉시 호출: now())
     * @return 이번 호출에서 새로 저장된 스냅샷 수 (이미 존재했던 항목은 카운트에 포함 안 함)
     */
    @Transactional
    public int captureForSeason(Long seasonId, LocalDateTime capturedAt) {

        // 시즌 조회 — 존재하지 않으면 어드민 호출 자체가 잘못된 케이스
        ContestSeason season = contestSeasonRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 정산 대상 심볼 목록 — 시즌 내 OPEN 포지션의 distinct 심볼
        // 거래가 한 건도 없거나 모두 이미 청산된 시즌은 빈 목록 반환되어 자연스럽게 no-op
        List<String> symbols = futuresPositionRepository.findDistinctOpenSymbolsByContestSeason(seasonId);
        if (symbols.isEmpty()) {
            log.info("[정산 스냅샷] 캡처할 심볼 없음 — seasonId={}", seasonId);
            return 0;
        }

        // 사전 검증 + 가격 수집 — 한 심볼이라도 캐시에 없으면 부분 저장 막고 예외
        // (모든 가격이 확보된 시점에만 일괄 저장 → 정산 단계에서 lookup 실패 가능성 제거)
        Map<String, BigDecimal> prices = new HashMap<>();
        List<String> missingSymbols = new ArrayList<>();
        for (String symbol : symbols) {
            Optional<BigDecimal> price = futuresCurrentPriceService.findCurrentPrice(symbol);
            if (price.isEmpty()) {
                missingSymbols.add(symbol);
            } else {
                prices.put(symbol, price.get());
            }
        }
        if (!missingSymbols.isEmpty()) {
            log.warn("[정산 스냅샷] ticker 캐시 누락 심볼 발견 — seasonId={}, missing={}", seasonId, missingSymbols);
            throw ContestException.settlementSnapshotPriceUnavailable(missingSymbols);
        }

        // 멱등 저장 — 이미 존재하는 (시즌, 심볼) 은 건너뜀 (스케줄러 재실행 / 어드민 재호출 안전성)
        int captured = 0;
        for (Map.Entry<String, BigDecimal> entry : prices.entrySet()) {
            String symbol = entry.getKey();
            if (snapshotRepository.existsByContestSeason_IdAndSymbol(seasonId, symbol)) {
                continue;
            }
            snapshotRepository.save(ContestSettlementPriceSnapshot.capture(
                    season, symbol, entry.getValue(), capturedAt
            ));
            captured++;
        }

        log.info("[정산 스냅샷] 캡처 완료 — seasonId={}, totalSymbols={}, newlyCaptured={}",
                seasonId, symbols.size(), captured);
        return captured;
    }
}
