package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.dto.request.FuturesLimitOrderCloseRequestDto;
import com.yogimangchi.domain.futures.dto.request.FuturesLimitOrderOpenRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesLimitOrderResponseDto;
import com.yogimangchi.domain.futures.entity.FuturesLeverageSetting;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.event.LimitOrderPlacedEvent;
import com.yogimangchi.domain.futures.event.LimitOrderRemovedEvent;
import com.yogimangchi.domain.futures.repository.FuturesLeverageSettingRepository;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import com.yogimangchi.domain.futures.support.FuturesWalletReader;
import com.yogimangchi.domain.market.repository.FuturesSymbolPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FuturesLimitOrderService {

    private final FuturesWalletReader futuresWalletReader;
    private final FuturesCurrentPriceService futuresCurrentPriceService;
    private final FuturesOrderRepository futuresOrderRepository;
    private final FuturesPositionRepository futuresPositionRepository;
    private final FuturesLeverageSettingRepository futuresLeverageSettingRepository;
    private final FuturesSymbolPolicyRepository futuresSymbolPolicyRepository;
    private final ApplicationEventPublisher eventPublisher;

    // 지정가(maker) 수수료율
    private static final BigDecimal LIMIT_TRADE_FEE = new BigDecimal("0.0003");
    // 최소 주문 명목금액
    private static final BigDecimal MIN_ORDER_NOTIONAL = new BigDecimal("10");

    // 지정가 진입 주문 등록
    // - 지정가 가격 방향 검증 (LONG: 현재가 아래, SHORT: 현재가 위)
    // - 증거금 + 수수료 선차감 후 PENDING 상태로 주문 저장
    @Transactional
    public FuturesLimitOrderResponseDto placeLimitOrderOpen(Long memberId, Long contestSeasonId, FuturesLimitOrderOpenRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();

        // 지갑 조회 (비관적 락 — 잔고 차감 필요)
        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getTradableRealWallet(memberId)
                : futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);

        futuresSymbolPolicyRepository.findWithMarketSymbolBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("선물 거래를 지원하지 않는 심볼입니다: " + symbol));

        // 현재 ticker 가격 조회
        BigDecimal currentPrice = futuresCurrentPriceService.getCurrentPrice(symbol);

        // 지정가 방향 검증 — 즉시 체결되는 주문 방지
        validateOpenOrderPrice(request.positionSide(), request.orderPrice(), currentPrice);

        // 명목금액 및 최소 주문 검증
        BigDecimal notionalAmount = request.orderPrice().multiply(request.orderQuantity());
        if (notionalAmount.compareTo(MIN_ORDER_NOTIONAL) < 0) {
            throw new IllegalArgumentException("최소 주문 금액이 '10YD' 보다 낮습니다.");
        }

        // 레버리지 조회 (설정 없으면 기본값 1)
        int leverage = futuresLeverageSettingRepository.findByAssetsAndSymbol(wallet, symbol)
                .map(FuturesLeverageSetting::getLeverage)
                .orElse(1);

        // 증거금 및 수수료 계산
        BigDecimal orderMargin = notionalAmount.divide(BigDecimal.valueOf(leverage), 8, RoundingMode.HALF_UP);
        BigDecimal totalFee = notionalAmount.multiply(LIMIT_TRADE_FEE).setScale(8, RoundingMode.HALF_UP);

        // 잔고 검증 및 차감 (주문 취소 시 반환)
        BigDecimal totalRequired = orderMargin.add(totalFee);
        if (wallet.getCurrentMoney().compareTo(totalRequired) < 0) {
            throw new IllegalArgumentException("주문에 필요한 금액이 지갑 잔고금액보다 큽니다.");
        }
        wallet.subtractMoney(totalRequired);

        // PENDING 상태로 주문 저장
        FuturesOrder order = FuturesOrder.orderLimitCreate(
                wallet, symbol, request.positionSide(), PositionStatus.OPEN,
                request.orderPrice(), request.orderQuantity(),
                orderMargin, notionalAmount, totalFee
        );
        futuresOrderRepository.save(order);

        // [알림] SSE로 지정가 진입 주문 등록됨을 wallet.getMember().getId() 대상으로 알리는 로직

        // 커밋 확정 후 Registry 등록 + 스케줄러 활성화
        eventPublisher.publishEvent(new LimitOrderPlacedEvent(symbol));

        return FuturesLimitOrderResponseDto.from(order);
    }

    // 지정가 청산 주문 등록
    // - 포지션 존재 및 수량 검증
    // - 지정가 방향 검증 (LONG: 현재가 위, SHORT: 현재가 아래)
    // - 증거금 선차감 없음 — 수수료는 체결 시 정산금액에서 차감
    @Transactional
    public FuturesLimitOrderResponseDto placeLimitOrderClose(Long memberId, Long contestSeasonId, FuturesLimitOrderCloseRequestDto request) {

        // 지갑 조회 (읽기용 — 청산 주문 등록 시 잔고 변동 없음)
        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getReadableRealWallet(memberId)
                : futuresWalletReader.getReadableContestWallet(memberId, contestSeasonId);

        // 청산 대상 포지션 조회 및 검증
        FuturesPosition position = futuresPositionRepository.findById(request.positionId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포지션입니다."));

        if (!position.getAssets().getId().equals(wallet.getId())) {
            throw new IllegalArgumentException("해당 포지션에 대한 접근 권한이 없습니다.");
        }
        if (position.getPositionStatus() != PositionStatus.OPEN) {
            throw new IllegalArgumentException("이미 청산된 포지션입니다.");
        }
        if (request.closeQuantity().compareTo(position.getFilledQuantity()) > 0) {
            throw new IllegalArgumentException("청산 수량이 보유 수량을 초과합니다.");
        }

        String symbol = position.getSymbol();
        PositionSide positionSide = position.getPositionSide();

        // 이미 등록된 PENDING 지정가 CLOSE 주문 수량 합산 — 이중 청산 등록 방지
        BigDecimal totalPendingCloseQty = futuresOrderRepository
                .findAllPendingLimitCloseOrders(wallet, symbol, positionSide)
                .stream()
                .map(FuturesOrder::getOrderQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPendingCloseQty.add(request.closeQuantity()).compareTo(position.getFilledQuantity()) > 0) {
            throw new IllegalArgumentException(
                    "등록 가능한 청산 수량을 초과합니다. 보유수량: " + position.getFilledQuantity()
                    + ", 미체결 청산 합계: " + totalPendingCloseQty
            );
        }

        // 현재 ticker 가격 조회
        BigDecimal currentPrice = futuresCurrentPriceService.getCurrentPrice(symbol);

        // 지정가 방향 검증 — 익절 방향만 허용 (스탑로스 별도 미지원)
        validateCloseOrderPrice(positionSide, request.orderPrice(), currentPrice);

        // 명목금액 계산 (체결 시 수수료 계산 기준, 등록 시점 참고용)
        BigDecimal notionalAmount = request.orderPrice().multiply(request.closeQuantity());

        // CLOSE 주문 — 증거금 선차감 없음 (포지션 증거금에서 체결 시 정산)
        FuturesOrder order = FuturesOrder.orderLimitCreate(
                wallet, symbol, positionSide, PositionStatus.CLOSE,
                request.orderPrice(), request.closeQuantity(),
                BigDecimal.ZERO, notionalAmount, BigDecimal.ZERO
        );
        futuresOrderRepository.save(order);

        // [알림] SSE로 지정가 청산 주문 등록됨을 wallet.getMember().getId() 대상으로 알리는 로직

        // 커밋 확정 후 Registry 등록 + 스케줄러 활성화
        eventPublisher.publishEvent(new LimitOrderPlacedEvent(symbol));

        return FuturesLimitOrderResponseDto.from(order);
    }

    // 지정가 주문 취소
    // - OPEN 주문 취소 시: 선차감했던 증거금 + 수수료 반환
    // - CLOSE 주문 취소 시: 선차감 없었으므로 반환 없음
    @Transactional
    public void cancelLimitOrder(Long memberId, Long contestSeasonId, Long orderId) {

        // 주문 조회 (비관적 락 — 상태 변경 + 잔고 반환 동시 처리)
        FuturesOrder order = futuresOrderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 주문입니다."));

        // 지갑 조회 (OPEN 주문 취소 시 잔고 반환 필요)
        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getTradableRealWallet(memberId)
                : futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);

        // 소유권 검증
        if (!order.getAssets().getId().equals(wallet.getId())) {
            throw new IllegalArgumentException("해당 주문에 대한 접근 권한이 없습니다.");
        }

        // PENDING 상태 검증 — 이미 체결/취소된 주문은 취소 불가
        if (order.getOrderStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("취소할 수 없는 주문 상태입니다: " + order.getOrderStatus());
        }

        // OPEN 주문 취소 시 증거금 + 수수료 반환
        if (order.getPositionAction() == PositionStatus.OPEN) {
            BigDecimal refund = order.getOrderMargin().add(order.getTotalFee());
            wallet.addMoney(refund);
        }
        // CLOSE 주문은 등록 시 선차감 없었으므로 반환 없음

        // 주문 취소 상태로 전환
        order.cancel(LocalDateTime.now());

        // [알림] SSE로 지정가 주문 취소됨을 wallet.getMember().getId() 대상으로 알리는 로직

        // 커밋 확정 후 Registry 보유자 수 -1 + 스케줄러 정리
        eventPublisher.publishEvent(new LimitOrderRemovedEvent(order.getSymbol()));
    }

    // 진입 지정가 방향 검증
    // LONG  진입: 현재가보다 낮은 가격에 매수 대기 (지정가 < 현재가)
    // SHORT 진입: 현재가보다 높은 가격에 매도 대기 (지정가 > 현재가)
    private void validateOpenOrderPrice(PositionSide positionSide, BigDecimal orderPrice, BigDecimal currentPrice) {
        if (positionSide == PositionSide.LONG && orderPrice.compareTo(currentPrice) >= 0) {
            throw new IllegalArgumentException("LONG 진입 지정가는 현재가보다 낮아야 합니다. (현재가: " + currentPrice + ")");
        }
        if (positionSide == PositionSide.SHORT && orderPrice.compareTo(currentPrice) <= 0) {
            throw new IllegalArgumentException("SHORT 진입 지정가는 현재가보다 높아야 합니다. (현재가: " + currentPrice + ")");
        }
    }

    // 청산 지정가 방향 검증 (익절 전용)
    // LONG  청산: 현재가보다 높은 가격에 익절 (지정가 > 현재가)
    // SHORT 청산: 현재가보다 낮은 가격에 익절 (지정가 < 현재가)
    private void validateCloseOrderPrice(PositionSide positionSide, BigDecimal orderPrice, BigDecimal currentPrice) {
        if (positionSide == PositionSide.LONG && orderPrice.compareTo(currentPrice) <= 0) {
            throw new IllegalArgumentException("LONG 청산 지정가는 현재가보다 높아야 합니다. (현재가: " + currentPrice + ")");
        }
        if (positionSide == PositionSide.SHORT && orderPrice.compareTo(currentPrice) >= 0) {
            throw new IllegalArgumentException("SHORT 청산 지정가는 현재가보다 낮아야 합니다. (현재가: " + currentPrice + ")");
        }
    }
}
