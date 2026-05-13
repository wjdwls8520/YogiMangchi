package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

/**
 * 대회 시즌 정산 Phase 2 — 포지션 청산 청크 트랜잭션 실행기
 *
 * 청크 한 묶음을 별도 트랜잭션(REQUIRES_NEW)으로 처리한다.
 *  - 별도 빈으로 분리한 이유: Spring AOP 프록시는 같은 클래스 내부 호출엔 트랜잭션 어노테이션이 안 먹힘
 *  - 청크별로 부분 커밋 → 중간 실패해도 이전 청크는 보존, 재실행 시 keyset 페이징 + OPEN 필터로 자연 재개
 *
 * 정확성 보장
 *   - N+1 방지: findAllById 로 청크 엔티티 일괄 로드 (쿼리 1번)
 *   - 정합성: positionStatus = OPEN 가드로 이미 CLOSE 인 포지션은 건너뜀 (멱등)
 *   - 데드락 방지: 지갑 락 미사용 (wallet 미변경 정책). 다른 트랜잭션도 시즌 만료 필터로 차단되어 충돌 가능성 거의 0
 *   - 동시성: 만에 하나 동시 호출되어도 OPEN 가드로 중복 처리 방지
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContestSettlementPositionCloseChunkExecutor {

    private final FuturesPositionRepository futuresPositionRepository;

    /**
     * 청크 단위로 포지션을 정산 청산한다.
     *
     * @param positionIds    이번 청크에서 처리할 포지션 ID 목록 (keyset 페이징 결과)
     * @param snapshotPrices 시즌 스냅샷에서 만든 심볼→가격 매핑 (사전 검증되어 있어 lookup 실패 없음)
     * @return 이번 청크에서 실제로 CLOSE 처리된 포지션 수 (이미 CLOSE 였던 건 카운트 제외)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int closeChunk(List<Long> positionIds, Map<String, BigDecimal> snapshotPrices) {
        if (positionIds.isEmpty()) {
            return 0;
        }

        // 청크 엔티티 일괄 로드 — N+1 방지를 위해 단일 쿼리로 모두 가져옴
        List<FuturesPosition> positions = futuresPositionRepository.findAllById(positionIds);

        int closed = 0;
        for (FuturesPosition position : positions) {
            // 멱등 가드 — 다른 경로에서 이미 CLOSE 된 포지션은 건너뜀
            if (position.getPositionStatus() != PositionStatus.OPEN) {
                continue;
            }

            BigDecimal snapshotPrice = snapshotPrices.get(position.getSymbol());
            if (snapshotPrice == null) {
                // Phase 1 사전 검증을 통과했다면 도달 불가 — 방어적으로 로그 + skip
                // (운영 중 발생하면 스냅샷 캡처와 청산 사이에 새 심볼 포지션이 끼어든 경우)
                log.error("[정산 청크] 스냅샷 가격 누락 — positionId={}, symbol={}",
                        position.getId(), position.getSymbol());
                continue;
            }

            // 실현손익 계산 (스냅샷 가격 기준)
            //   LONG  = (스냅샷가 - 진입가) × 수량
            //   SHORT = (진입가 - 스냅샷가) × 수량
            BigDecimal realizedPnl = calculateRealizedPnl(position, snapshotPrice);

            // 포지션 CLOSE 처리 — wallet 은 손대지 않음 (시즌 정산 정책)
            position.settleClose(realizedPnl);
            closed++;
        }

        return closed;
    }

    // 스냅샷 가격 기준 실현손익 산출 — LONG/SHORT 부호 분기
    private BigDecimal calculateRealizedPnl(FuturesPosition position, BigDecimal snapshotPrice) {
        return switch (position.getPositionSide()) {
            case LONG -> snapshotPrice.subtract(position.getEntryPrice())
                    .multiply(position.getFilledQuantity())
                    .setScale(8, RoundingMode.HALF_UP);
            case SHORT -> position.getEntryPrice().subtract(snapshotPrice)
                    .multiply(position.getFilledQuantity())
                    .setScale(8, RoundingMode.HALF_UP);
        };
    }
}
