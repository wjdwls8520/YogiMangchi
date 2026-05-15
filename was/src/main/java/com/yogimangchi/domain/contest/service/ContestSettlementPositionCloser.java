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
 * 대회 시즌 정산 단계 — 포지션 일괄 청산 오케스트레이션
 *
 * 1단계(스냅샷 캡처)에서 저장된 스냅샷 가격을 기준으로 시즌 내 모든 OPEN 포지션을 CLOSE 처리한다.
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

    // 청크 사이 스로틀 — 청크 커밋 후 다음 청크 시작 전 대기 시간(ms)
    //
    // 목적: DB 부하 평탄화. 청크 한 묶음 처리 후 2초 동안 DB 가 자유로워져 다른 트래픽 처리에 여유.
    // 저사양 서버 환경에서도 사용자 영향 최소화. 한 정산에 추가되는 시간은 (청크 수 × 2초) 로 예측 가능.
    //
    // 예) 5만 포지션 = 100 청크 × (1초 처리 + 2초 sleep) ≈ 5분
    private static final long CHUNK_THROTTLE_MILLIS = 2_000L;

    // 청크 한 묶음 처리 임계 시간 — 초과 시 WARN 로그로 이상 징후 조기 탐지
    // DB 락 경합, 인덱스 부재, 네트워크 지연 등이 누적되면 청크 시간이 비정상적으로 길어짐
    private static final long CHUNK_DURATION_WARN_THRESHOLD_MILLIS = 30_000L;

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
        int chunkIndex = 0;

        // keyset 페이징 루프 — 빈 청크가 나올 때까지 반복
        while (true) {
            List<Long> chunkIds = futuresPositionRepository
                    .findOpenPositionIdsByContestSeasonAfterId(seasonId, lastId, CHUNK_SIZE);

            if (chunkIds.isEmpty()) {
                break;
            }

            chunkIndex++;

            // 청크 처리 시간 측정 — 이상 징후 탐지 + 운영 가시성
            long chunkStartMillis = System.currentTimeMillis();
            int closedInChunk = chunkExecutor.closeChunk(chunkIds, snapshotPrices);
            long chunkDurationMillis = System.currentTimeMillis() - chunkStartMillis;
            totalClosed += closedInChunk;

            // 진척 로그 — 어드민 콘솔에서 "지금 어디까지 진행 중인지" 확인 가능
            // 임계 시간 초과 시 WARN 으로 격상해 운영자 주의 환기
            if (chunkDurationMillis > CHUNK_DURATION_WARN_THRESHOLD_MILLIS) {
                log.warn("[정산 포지션 청산] 청크 처리 지연 — seasonId={}, chunk={}, size={}, durationMs={}",
                        seasonId, chunkIndex, chunkIds.size(), chunkDurationMillis);
            } else {
                log.info("[정산 포지션 청산] 청크 처리 — seasonId={}, chunk={}, size={}, durationMs={}, totalClosed={}",
                        seasonId, chunkIndex, chunkIds.size(), chunkDurationMillis, totalClosed);
            }

            // 다음 청크 시작점 = 이번 청크의 마지막 ID (id ASC 정렬 보장됨)
            lastId = chunkIds.get(chunkIds.size() - 1);

            // 청크 사이 스로틀 — DB 부하 평탄화
            // 마지막 청크라면(=다음 fetch 가 빈 결과) 이 대기는 낭비지만, 미리 알 방법이 없고 비용이 작아 무시
            sleepBetweenChunks();
        }

        log.info("[정산 포지션 청산] 완료 — seasonId={}, totalChunks={}, totalClosed={}",
                seasonId, chunkIndex, totalClosed);
        return totalClosed;
    }

    // 청크 사이 대기 — 인터럽트 발생 시 즉시 중단하고 인터럽트 플래그 복원
    // 서버 종료 등으로 인터럽트되면 오케스트레이터에서 markFailed 처리하도록 예외 흘림
    private void sleepBetweenChunks() {
        try {
            Thread.sleep(CHUNK_THROTTLE_MILLIS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("포지션 일괄 청산 청크 사이 스로틀 대기 중 인터럽트 발생", e);
        }
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
