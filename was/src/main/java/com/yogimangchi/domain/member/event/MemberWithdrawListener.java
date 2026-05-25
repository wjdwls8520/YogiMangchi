package com.yogimangchi.domain.member.event;

import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.futures.dto.query.FuturesOpenPositionSymbolCountDto;
import com.yogimangchi.domain.futures.dto.query.FuturesPendingSymbolCountDto;
import com.yogimangchi.domain.futures.limitTradeEngine.FuturesLimitOrderRegistry;
import com.yogimangchi.domain.futures.liquidation.FuturesLiquidationRegistry;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import com.yogimangchi.domain.member.service.MemberWithdrawChunkExecutor;
import com.yogimangchi.domain.spot.dto.query.SpotPendingSymbolCountDto;
import com.yogimangchi.domain.spot.matching.LimitOrderSignalRegistry;
import com.yogimangchi.domain.spot.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 회원탈퇴 후처리 비동기 리스너
 * 
 * 1. 지갑 선 비활성화: 지갑을 INACTIVE로 전환하여 매칭/청산 엔진 스케줄러가 즉시 이 회원을 배제하도록 처리 (경합 차단)
 * 2. 인메모리 카운터 차감: 탈퇴 회원의 미체결 주문 및 오픈 포지션 수만큼 Registry에서 차감하여 스케줄러 공회전 방지
 * 3. 비동기 청크 청산: 500개 단위의 독립 트랜잭션 청크를 가동하여 오픈 포지션들을 순차적으로 강제 청산(CLOSE)
 * 
 * * 락 데드락 및 커넥션 고갈 예방을 위해 리스너 레벨에는 @Transactional을 걸지 않습니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MemberWithdrawListener {

    private final AssetRepository assetRepository;
    private final FuturesPositionRepository futuresPositionRepository;
    private final FuturesOrderRepository futuresOrderRepository;
    private final OrderRepository spotOrderRepository;

    private final FuturesLiquidationRegistry futuresLiquidationRegistry;
    private final FuturesLimitOrderRegistry futuresLimitOrderRegistry;
    private final LimitOrderSignalRegistry spotLimitOrderSignalRegistry;

    private final MemberWithdrawChunkExecutor withdrawChunkExecutor;

    private static final int CHUNK_SIZE = 500;
    private static final long CHUNK_THROTTLE_MILLIS = 1000L;

    @Async
    @EventListener
    public void handleMemberWithdrawn(MemberWithdrawnEvent event) {
        Long memberId = event.memberId();
        log.info("[회원탈퇴 후처리 시작] memberId={}", memberId);

        try {
            // Step 1: 회원의 모든 활성 지갑을 INACTIVE 상태로 선 비활성화 (동시성 경합 원천 차단)
            int affectedWallets = assetRepository.deactivateWalletsByMemberId(memberId, LocalDateTime.now());
            log.info("[회원탈퇴 후처리] 지갑 비활성화 완료 — memberId={}, deactivatedCount={}", memberId, affectedWallets);

            // Step 2: 회원의 선물 오픈 포지션, 선물 대기 주문, 현물 대기 주문의 심볼별 개수 조회 및 인메모리 카운터 차감
            decrementInMemoryRegistries(memberId);

            // Step 3: 비활성화된 지갑들의 남은 선물 오픈 포지션을 청크 단위로 순차 청산 및 커밋
            int totalClosedPositions = closeMemberOpenPositions(memberId);
            log.info("[회원탈퇴 후처리 완료] memberId={}, totalClosedPositions={}", memberId, totalClosedPositions);

        } catch (Exception e) {
            log.error("[회원탈퇴 후처리 오류] memberId={}, message={}", memberId, e.getMessage(), e);
        }
    }

    private void decrementInMemoryRegistries(Long memberId) {
        // 1. 선물 오픈 포지션 인메모리 카운터 감시 차감
        List<FuturesOpenPositionSymbolCountDto> positionCounts =
                futuresPositionRepository.findOpenPositionCountsByMemberId(memberId);
        for (FuturesOpenPositionSymbolCountDto pc : positionCounts) {
            futuresLiquidationRegistry.deregister(pc.symbol(), pc.count().intValue());
            log.info("[회원탈퇴 후처리] 선물 청산 감시 차감 — symbol={}, count={}", pc.symbol(), pc.count());
        }

        // 2. 선물 대기 지정가 주문 인메모리 카운터 감시 차감
        List<FuturesPendingSymbolCountDto> futuresOrderCounts =
                futuresOrderRepository.findPendingLimitOrderCountsByMemberId(memberId);
        for (FuturesPendingSymbolCountDto fc : futuresOrderCounts) {
            futuresLimitOrderRegistry.deregister(fc.symbol(), fc.count().intValue());
            log.info("[회원탈퇴 후처리] 선물 지정가 감시 차감 — symbol={}, count={}", fc.symbol(), fc.count());
        }

        // 3. 현물 대기 지정가 주문 인메모리 카운터 감시 차감
        List<SpotPendingSymbolCountDto> spotOrderCounts =
                spotOrderRepository.findPendingLimitOrderCountsByMemberId(memberId);
        for (SpotPendingSymbolCountDto sc : spotOrderCounts) {
            spotLimitOrderSignalRegistry.decrementOpenOrder(sc.symbol(), sc.count().intValue());
            log.info("[회원탈퇴 후처리] 현물 지정가 감시 차감 — symbol={}, count={}", sc.symbol(), sc.count());
        }
    }

    private int closeMemberOpenPositions(Long memberId) {
        int totalClosed = 0;
        long lastId = 0L;
        int chunkIndex = 0;

        while (true) {
            // Keyset 페이징 조회로 탈퇴 회원의 OPEN 포지션 ID 500개 묶음 조회
            List<Long> positionIds = futuresPositionRepository
                    .findOpenPositionIdsByMemberIdAfterId(memberId, lastId, CHUNK_SIZE);

            if (positionIds.isEmpty()) {
                break;
            }

            chunkIndex++;
            long chunkStartMillis = System.currentTimeMillis();

            // REQUIRES_NEW 독립 트랜잭션으로 청크 실행 및 개별 커밋
            int closedInChunk = withdrawChunkExecutor.closeChunk(positionIds);
            long chunkDurationMillis = System.currentTimeMillis() - chunkStartMillis;
            totalClosed += closedInChunk;

            log.info("[회원탈퇴 후처리] 포지션 청크 청산 완료 — memberId={}, chunk={}, size={}, durationMs={}, totalClosed={}",
                    memberId, chunkIndex, positionIds.size(), chunkDurationMillis, totalClosed);

            lastId = positionIds.get(positionIds.size() - 1);

            // DB 부하 평탄화를 위한 스로틀 지연 적용
            sleepBetweenChunks();
        }

        return totalClosed;
    }

    private void sleepBetweenChunks() {
        try {
            Thread.sleep(CHUNK_THROTTLE_MILLIS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("회원탈퇴 포지션 청크 사이 스로틀 대기 중 인터럽트 발생", e);
        }
    }
}
