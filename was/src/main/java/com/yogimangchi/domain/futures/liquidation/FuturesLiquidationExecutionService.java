package com.yogimangchi.domain.futures.liquidation;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.event.PositionClosedEvent;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import com.yogimangchi.domain.futures.service.FuturesPendingCloseOrderCleanupService;
import com.yogimangchi.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 강제청산이 트리거됐을 때 실제로 포지션을 청산하는 서비스
 *
 *   Coordinator가 "이 포지션 청산해" 라고 신호를 보내면
 *     → 포지션 조회 + 락
 *     → 지갑 조회 + 락
 *     → 실현손익 계산
 *     → 지갑 정산 (수수료는 청산가에 미리 반영됨)
 *     → 포지션 CLOSE 상태로 전환
 *     → Registry 카운트 -1
 */

@Slf4j
@Service
@RequiredArgsConstructor
public class FuturesLiquidationExecutionService {

    private final FuturesPositionRepository futuresPositionRepository;
    private final AssetRepository assetRepository;
    private final FuturesPendingCloseOrderCleanupService futuresPendingCloseOrderCleanupService;
    private final ApplicationEventPublisher eventPublisher;
    private final NotificationService notificationService;

    // 포지션 1개 강제청산 — Coordinator에서 포지션ID 단위로 호출
    @Transactional
    public void executeLiquidation(Long positionId, BigDecimal windowMinPrice, BigDecimal windowMaxPrice) {

        // Step 1: 락 없이 포지션 조회 — 지갑 ID 확보 및 초기 상태 확인용
        // (락 순서: 지갑 → 포지션. 시장가/지정가 청산과 동일하게 유지해야 데드락 방지)
        FuturesPosition positionNoLock = futuresPositionRepository.findById(positionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포지션입니다."));

        if (positionNoLock.getPositionStatus() != PositionStatus.OPEN) {
            log.info("[강제청산 스킵] positionId={}, status={}", positionId, positionNoLock.getPositionStatus());
            return;
        }

        // Step 2: 지갑 락 먼저 — 모든 청산 경로에서 지갑 → 포지션 순서로 락을 획득해야 데드락이 발생하지 않음
        Assets wallet = assetRepository.findByIdForUpdate(positionNoLock.getAssets().getId())
                .orElseThrow(() -> new IllegalArgumentException("지갑을 찾을 수 없습니다."));

        // Step 3: 포지션 락
        FuturesPosition position = futuresPositionRepository.findByIdForUpdate(positionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포지션입니다."));

        // Step 4: 락 획득 후 OPEN 상태 재확인 — 락 대기 중 다른 스레드가 먼저 청산을 완료했을 가능성 방어
        if (position.getPositionStatus() != PositionStatus.OPEN) {
            log.info("[강제청산 스킵 — 락 후 재확인] positionId={}, status={}", positionId, position.getPositionStatus());
            return;
        }

        // Step 5: 강제청산 조건 재검증 — 트리거 당시의 가격 범위(min/max)로 재판단
        // LONG:  minPrice ≤ liquidationPrice 이면 청산 (구간 내 최저가가 청산가 이하)
        // SHORT: maxPrice ≥ liquidationPrice 이면 청산 (구간 내 최고가가 청산가 이상)
        boolean stillTriggered = switch (position.getPositionSide()) {
            case LONG  -> windowMinPrice.compareTo(position.getLiquidationPrice()) <= 0;
            case SHORT -> windowMaxPrice.compareTo(position.getLiquidationPrice()) >= 0;
        };
        if (!stillTriggered) {
            log.info("[강제청산 조건 해소] positionId={}, side={}, windowMin={}, windowMax={}, liqPrice={}",
                    positionId, position.getPositionSide(), windowMinPrice, windowMaxPrice, position.getLiquidationPrice());
            return;
        }

        BigDecimal closeQuantity = position.getFilledQuantity(); // 전량 청산이므로 현재 보유 수량 전부를 청산 수량으로 사용
        BigDecimal closeNotional = position.getNotionalAmount(); // 전량 청산이므로 진입 기준 명목금액 전체를 제거
        BigDecimal closeMargin   = position.getTotalMargin();    // 청산 증거금 = 포지션에 투입된 총 증거금 전액 (전량 청산이므로 전부 회수 대상)

        // 실현손익 계산 — 정산 기준가로 liquidationPrice 사용
        // markPrice 기준으로 하면 시스템이 늦게 발견했을 때 settlement가 음수가 될 수 있음
        // liquidationPrice는 수수료를 포함해 설계되어 있어 이 가격 기준 settlement > 0 항상 보장
        // (markPrice는 Step 5 재검증에만 사용됨)
        // LONG  = (청산가 - 진입가) × 수량
        // SHORT = (진입가 - 청산가) × 수량
        BigDecimal realizedPnl = switch (position.getPositionSide()) {
            case LONG  -> position.getLiquidationPrice().subtract(position.getEntryPrice())
                    .multiply(closeQuantity).setScale(8, RoundingMode.HALF_UP);
            case SHORT -> position.getEntryPrice().subtract(position.getLiquidationPrice())
                    .multiply(closeQuantity).setScale(8, RoundingMode.HALF_UP);
        };

        // 정산금액 = 증거금 + 실현손익
        // 수수료는 청산가 계산 시 이미 반영됐으므로 별도 차감 없음
        // 0 미만이면 0으로 cap — 잔고 마이너스 방지
        BigDecimal settlement = closeMargin.add(realizedPnl);
        if (settlement.compareTo(BigDecimal.ZERO) > 0) {
            wallet.addMoney(settlement);
        }

        // 포지션 수치 차감 (전량 청산 → CLOSE 상태로 전환)
        position.reduce(closeQuantity, closeMargin, closeNotional, realizedPnl);

        futuresPendingCloseOrderCleanupService.reconcilePendingCloseOrders(
                wallet, position.getSymbol(), position.getPositionSide(), position.getFilledQuantity()
        );

        // 트랜잭션 종료 후 LAZY 접근 불가 — 값을 미리 추출
        notificationService.notifyFuturesLiquidationCompleted(
                wallet.getMember(),
                wallet.getType(),
                position.getSymbol(),
                position.getPositionSide(),
                position.getLiquidationPrice(),
                closeQuantity,
                realizedPnl
        );

        // 트랜잭션 커밋 완료 후 Registry deregister — 롤백 시 인메모리 불일치 방지
        // FuturesLiquidationEventListener.onPositionClosed() 에서 AFTER_COMMIT으로 처리됨
        eventPublisher.publishEvent(new PositionClosedEvent(position.getSymbol()));

        log.info("[강제청산 완료] positionId={}, symbol={}, windowMin={}, windowMax={}, pnl={}",
                positionId, position.getSymbol(), windowMinPrice, windowMaxPrice, realizedPnl);
    }
}
