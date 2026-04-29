package com.yogimangchi.domain.futures.limitorder;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.futures.entity.FuturesLeverageSetting;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.event.LimitOrderRemovedEvent;
import com.yogimangchi.domain.futures.event.PositionClosedEvent;
import com.yogimangchi.domain.futures.event.PositionOpenedEvent;
import com.yogimangchi.domain.futures.repository.FuturesLeverageSettingRepository;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import com.yogimangchi.domain.futures.service.FuturesPendingCloseOrderCleanupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 지정가 주문 체결 실행 서비스
 *
 * Coordinator 가 체결 조건 도달을 감지하면 이 서비스를 호출한다.
 * OPEN / CLOSE 두 케이스를 처리하며, 각 주문은 독립된 @Transactional 로 실행된다.
 * 하나의 주문 체결 실패가 다른 주문 처리를 막지 않도록 Coordinator 에서 try-catch 처리됨.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FuturesLimitOrderExecutionService {

    private final FuturesOrderRepository futuresOrderRepository;
    private final FuturesPositionRepository futuresPositionRepository;
    private final AssetRepository assetRepository;
    private final FuturesLeverageSettingRepository futuresLeverageSettingRepository;
    private final FuturesPendingCloseOrderCleanupService futuresPendingCloseOrderCleanupService;
    private final ApplicationEventPublisher eventPublisher;

    // 지정가(maker) 수수료율 — 시장가(taker) 0.0005 보다 낮음
    private static final BigDecimal LIMIT_TRADE_FEE = new BigDecimal("0.0003");

    // Coordinator 에서 주문 ID 단위로 호출 — OPEN / CLOSE 분기
    @Transactional
    public void executeLimitOrder(Long orderId) {

        // 주문 조회 (비관적 락 — 동시 체결 중복 방지)
        FuturesOrder order = futuresOrderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 주문입니다."));

        // 이미 체결되거나 취소된 주문이면 스킵 (다른 스레드가 먼저 처리한 경우 방어)
        if (order.getOrderStatus() != OrderStatus.PENDING) {
            log.info("[지정가 체결 스킵] orderId={}, status={}", orderId, order.getOrderStatus());
            return;
        }

        // 지갑 조회 (비관적 락 — 잔고 동시 수정 방지)
        Assets wallet = assetRepository.findByIdForUpdate(order.getAssets().getId())
                .orElseThrow(() -> new IllegalArgumentException("지갑을 찾을 수 없습니다."));

        // OPEN 주문: 포지션 생성 또는 추가진입
        // CLOSE 주문: 포지션 청산
        if (order.getPositionAction() == PositionStatus.OPEN) {
            executeOpen(order, wallet);
        } else {
            executeClose(order, wallet);
        }
    }

    // 지정가 진입 주문 체결 — 포지션 신규 생성 또는 동일 방향 포지션에 추가진입
    private void executeOpen(FuturesOrder order, Assets wallet) {
        String symbol = order.getSymbol();
        PositionSide positionSide = order.getPositionSide();
        BigDecimal executionPrice = order.getOrderPrice();    // 지정가 = 체결가
        BigDecimal quantity = order.getOrderQuantity();

        // 체결 시점 방향별 레버리지 조회 (지갑+심볼+방향 기준, 설정 없으면 기본값 1)
        // 주문 등록 시 증거금은 이미 해당 레버리지로 계산되어 지갑에서 차감된 상태
        int leverage = futuresLeverageSettingRepository.findByAssetsAndSymbolAndPositionSide(wallet, symbol, positionSide)
                .map(FuturesLeverageSetting::getLeverage)
                .orElse(1);

        // 등록 시 계산된 증거금/명목금액 그대로 사용 (지갑에서 이미 차감 완료)
        BigDecimal orderMargin = order.getOrderMargin();
        BigDecimal notionalAmount = order.getNotionalAmount();

        // 동일 심볼+방향의 OPEN 포지션이 있으면 추가진입(물타기), 없으면 신규 생성
        Optional<FuturesPosition> existing = futuresPositionRepository
                .findByAssetsAndSymbolAndPositionSideWherePositionStatusForUpdate(
                        wallet, symbol, positionSide, PositionStatus.OPEN);

        boolean isNewPosition;
        if (existing.isPresent()) {
            // 기존 포지션에 추가진입 — 평균 진입가 재계산, 증거금/명목금액 합산
            existing.get().addEntry(quantity, executionPrice, orderMargin, notionalAmount);
            isNewPosition = false;
        } else {
            // 신규 포지션 생성
            futuresPositionRepository.save(
                    FuturesPosition.open(wallet, symbol, positionSide, quantity, executionPrice, leverage, orderMargin, notionalAmount)
            );
            isNewPosition = true;
        }

        // 주문 COMPLETED 전환
        order.fill(LocalDateTime.now());

        // [알림] SSE로 지정가 진입 주문 체결됨을 wallet.getMember().getId() 대상으로 알리는 로직

        // 커밋 확정 후 Registry 동기화 (롤백 시 인메모리 불일치 방지)
        eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol));
        if (isNewPosition) {
            // 신규 포지션 → 강제청산 Registry 에도 등록
            eventPublisher.publishEvent(new PositionOpenedEvent(symbol));
        }

        log.info("[지정가 OPEN 체결] orderId={}, symbol={}, side={}, price={}, qty={}",
                order.getId(), symbol, positionSide, executionPrice, quantity);
    }

    // 지정가 청산 주문 체결 — 포지션 부분 또는 전체 청산
    private void executeClose(FuturesOrder order, Assets wallet) {
        String symbol = order.getSymbol();
        PositionSide positionSide = order.getPositionSide();
        BigDecimal executionPrice = order.getOrderPrice();    // 지정가 = 체결가
        BigDecimal closeQuantity = order.getOrderQuantity();

        // 청산 대상 OPEN 포지션 조회 (비관적 락)
        FuturesPosition position = futuresPositionRepository
                .findByAssetsAndSymbolAndPositionSideWherePositionStatusForUpdate(
                        wallet, symbol, positionSide, PositionStatus.OPEN)
                .orElseThrow(() -> new IllegalArgumentException("청산할 OPEN 포지션이 없습니다."));

        // 청산 수량 검증
        // 동시 청산(시장가/강제청산)으로 포지션이 이미 줄어든 경우 — Cleanup 서비스가 이 주문을 취소했어야 하지만
        // 락 경쟁으로 타이밍이 어긋났을 수 있으므로 여기서도 방어적으로 주문을 취소하고 종료
        if (closeQuantity.compareTo(position.getFilledQuantity()) > 0) {
            log.warn("[지정가 CLOSE 수량 초과 — 주문 취소] orderId={}, closeQty={}, positionQty={}",
                    order.getId(), closeQuantity, position.getFilledQuantity());
            order.cancel(LocalDateTime.now());
            eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol));
            return;
        }

        // 청산 비율 기준으로 증거금 / 명목금액 산출 (부분 청산 대응)
        BigDecimal closeMargin = position.calculateCloseMargin(closeQuantity);
        BigDecimal closeNotional = position.calculateCloseNotional(closeQuantity);
        BigDecimal executedNotional = executionPrice.multiply(closeQuantity).setScale(8, RoundingMode.HALF_UP);

        // 실현손익 계산
        // LONG  = (체결가 - 진입가) × 수량
        // SHORT = (진입가 - 체결가) × 수량
        BigDecimal realizedPnl = switch (positionSide) {
            case LONG  -> executionPrice.subtract(position.getEntryPrice())
                    .multiply(closeQuantity).setScale(8, RoundingMode.HALF_UP);
            case SHORT -> position.getEntryPrice().subtract(executionPrice)
                    .multiply(closeQuantity).setScale(8, RoundingMode.HALF_UP);
        };

        // 지정가(maker) 수수료 = 체결 명목금액 × 0.0003
        BigDecimal fee = executedNotional.multiply(LIMIT_TRADE_FEE).setScale(8, RoundingMode.HALF_UP);

        // 정산금액 = 증거금 + 실현손익 - 수수료, 0 미만이면 0으로 cap (잔고 마이너스 방지)
        BigDecimal settlement = closeMargin.add(realizedPnl).subtract(fee);
        if (settlement.compareTo(BigDecimal.ZERO) > 0) {
            wallet.addMoney(settlement);
        }

        // 포지션 수치 차감 (잔여수량 0이면 CLOSE 상태로 전환)
        position.reduce(closeQuantity, closeMargin, closeNotional, realizedPnl);

        // 주문 COMPLETED 전환
        order.fill(LocalDateTime.now());

        futuresPendingCloseOrderCleanupService.reconcilePendingCloseOrders(
                wallet, symbol, positionSide, position.getFilledQuantity()
        );

        boolean isFullyClosed = position.getFilledQuantity().compareTo(BigDecimal.ZERO) == 0;

        // [알림] SSE로 지정가 청산 주문 체결됨을 wallet.getMember().getId() 대상으로 알리는 로직
        // isFullyClosed == true 이면 완전 청산, false 이면 부분 청산으로 구분 가능

        // 커밋 확정 후 Registry 동기화
        eventPublisher.publishEvent(new LimitOrderRemovedEvent(symbol));
        if (isFullyClosed) {
            // 포지션 완전 청산 → 강제청산 Registry 에서도 제거
            eventPublisher.publishEvent(new PositionClosedEvent(symbol));
        }

        log.info("[지정가 CLOSE 체결] orderId={}, symbol={}, side={}, price={}, qty={}, pnl={}",
                order.getId(), symbol, positionSide, executionPrice, closeQuantity, realizedPnl);
    }
}
