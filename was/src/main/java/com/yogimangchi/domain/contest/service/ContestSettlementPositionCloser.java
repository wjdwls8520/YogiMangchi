package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.season.entity.ContestSettlementPriceSnapshot;
import com.yogimangchi.domain.contest.season.repository.ContestSettlementPriceSnapshotRepository;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 대회 시즌 정산 Phase 2 — 포지션 일괄 청산 오케스트레이션
 *
 * Phase 1 에서 저장된 스냅샷 가격을 기준으로 시즌 내 모든 OPEN 포지션을 CLOSE 처리한다.
 *
 * 처리 흐름
 *   1. 시즌의 스냅샷을 한 번에 로드 → 심볼→가격 Map 구성 (이후 청크마다 in-memory lookup)
 *   2. keyset 페이징으로 OPEN 포지션 ID 청크(CHUNK_SIZE) 조회
 *   3. ChunkExecutor 에 위임 — 청크 별도 트랜잭션(REQUIRES_NEW)으로 부분 커밋
 *   4. 빈 청크가 나올 때까지 반복
 *
 * 정확성 보장
 *   - N+1 방지: 스냅샷은 1회 로드, 청크 엔티티는 findAllById 로 일괄 로드 (Executor 내부)
 *   - 정합성: 청크별 부분 커밋이지만 멱등 가드 + keyset 페이징으로 중간 실패 시 자연 재개
 *   - 데드락 방지: 지갑 락 미사용, 단일 테이블(futures_position) dirty checking
 *   - 동시성: 시즌 만료 후라 다른 거래 트랜잭션 차단된 상태. 정산 동시 호출은 Step 7 시즌 락으로 방지
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestSettlementPositionCloser {

    // 청크 사이즈 — 너무 작으면 청크 오버헤드, 너무 크면 락 보유 시간 길어짐
    private static final int CHUNK_SIZE = 500;

    private final ContestSettlementPriceSnapshotRepository snapshotRepository;
    private final FuturesPositionRepository futuresPositionRepository;
    private final ContestSettlementPositionCloseChunkExecutor chunkExecutor;

    /**
     * 시즌 내 모든 OPEN 포지션을 스냅샷 가격 기준으로 CLOSE 처리.
     *
     * @param seasonId 정산 대상 시즌 ID
     * @return 이번 호출에서 새로 CLOSE 처리된 포지션 수 (멱등 재호출 시 0)
     */
    public int closeAllOpenPositions(Long seasonId) {

        // 스냅샷 일괄 로드 — 단일 쿼리로 시즌의 모든 (심볼, 가격) 을 메모리에 올림
        Map<String, BigDecimal> snapshotPrices = loadSnapshotPriceMap(seasonId);

        if (snapshotPrices.isEmpty()) {
            // Phase 1 이 선행되지 않았거나 시즌 내 OPEN 포지션이 없던 경우
            log.info("[정산 포지션 청산] 스냅샷 없음 — seasonId={}", seasonId);
            return 0;
        }

        int totalClosed = 0;
        long lastId = 0L;

        // keyset 페이징 루프 — 빈 청크가 나올 때까지 반복
        while (true) {
            List<Long> chunkIds = futuresPositionRepository
                    .findOpenPositionIdsByContestSeasonAfterId(seasonId, lastId, CHUNK_SIZE);

            if (chunkIds.isEmpty()) {
                break;
            }

            // 청크 별도 트랜잭션 위임 — 부분 커밋으로 락 보유 시간 최소화
            int closedInChunk = chunkExecutor.closeChunk(chunkIds, snapshotPrices);
            totalClosed += closedInChunk;

            // 다음 청크 시작점 = 이번 청크의 마지막 ID (id ASC 정렬 보장됨)
            lastId = chunkIds.get(chunkIds.size() - 1);
        }

        log.info("[정산 포지션 청산] 완료 — seasonId={}, totalClosed={}", seasonId, totalClosed);
        return totalClosed;
    }

    // 시즌 스냅샷을 단일 쿼리로 로드해 심볼→가격 Map 으로 변환 — 청크 루프에서 in-memory lookup 으로 사용
    private Map<String, BigDecimal> loadSnapshotPriceMap(Long seasonId) {
        List<ContestSettlementPriceSnapshot> snapshots =
                snapshotRepository.findAllByContestSeason_Id(seasonId);

        Map<String, BigDecimal> priceMap = new HashMap<>();
        for (ContestSettlementPriceSnapshot snapshot : snapshots) {
            priceMap.put(snapshot.getSymbol(), snapshot.getPrice());
        }
        return priceMap;
    }
}
