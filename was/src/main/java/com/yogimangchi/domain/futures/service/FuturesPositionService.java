package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.dto.query.FuturesPositionOpenResult;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FuturesPositionService {

    private final FuturesPositionRepository futuresPositionRepository;

    // 시장가 청산 수수료 (taker fee 0.05%)
    private static final BigDecimal TRADE_FEE = new BigDecimal("0.0005");

    /**
     * OPEN 주문 체결 시 호출 — FuturesOrderService 에서만 호출할 것
     * 지갑 잔고 검증, 심볼 검증은 FuturesOrderService 에서 완료된 상태로 호출됨
     * 독립적으로 호출 시 검증 없이 포지션만 생성되므로 주의
     */
    @Transactional
    public FuturesPositionOpenResult openPosition(
            Assets wallet,      // 검증이 완료된 지갑
            String symbol,
            PositionSide positionSide,
            BigDecimal quantity,
            BigDecimal entryPrice,
            int leverage,
            BigDecimal totalMargin,
            BigDecimal notionalAmount
    ) {
        Optional<FuturesPosition> existing = futuresPositionRepository
                .findByAssetsAndSymbolAndPositionSideWherePositionStatusForUpdate(wallet, symbol, positionSide, PositionStatus.OPEN);

        if (existing.isPresent()) {
            // 기존 포지션에 추가 진입 (물타기)
            existing.get().addEntry(quantity, entryPrice, totalMargin, notionalAmount);
            return new FuturesPositionOpenResult(existing.get(), false);
        } else {
            // 신규 포지션 생성
            FuturesPosition newPosition = futuresPositionRepository.save(
                    FuturesPosition.open(wallet, symbol, positionSide, quantity, entryPrice, leverage, totalMargin, notionalAmount)
            );
            return new FuturesPositionOpenResult(newPosition, true);
        }
    }

    /**
     * CLOSE 주문 체결 시 호출 — FuturesOrderService 에서만 호출할 것
     * 잔고 검증, 심볼 검증은 FuturesOrderService 에서 완료된 상태로 호출됨
     */
    @Transactional
    public FuturesPosition closePosition(
            Assets wallet,
            Long positionId,
            BigDecimal closeQuantity,
            BigDecimal closePrice
    ) {
        // 1. ID 기준 포지션 조회 (비관적 락 — 동시 청산 요청 방지)
        FuturesPosition position = futuresPositionRepository
                .findByIdForUpdate(positionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포지션입니다."));

        // 2. 소유권 검증 — 요청자의 지갑 소속 포지션인지 확인
        if (!position.getAssets().getId().equals(wallet.getId())) {
            throw new IllegalArgumentException("해당 포지션에 대한 접근 권한이 없습니다.");
        }

        // 3. OPEN 상태 검증
        if (position.getPositionStatus() != PositionStatus.OPEN) {
            throw new IllegalArgumentException("이미 청산된 포지션입니다.");
        }

        // 4. 청산 수량 검증
        if (closeQuantity.compareTo(position.getFilledQuantity()) > 0) {
            throw new IllegalArgumentException("보유 수량보다 청산 수량이 많습니다.");
        }

        PositionSide positionSide = position.getPositionSide();

        // 5. 비율 기준 증거금·명목금액 산출
        BigDecimal closeMargin = position.calculateCloseMargin(closeQuantity);
        BigDecimal closeNotional = position.calculateCloseNotional(closeQuantity);

        // 6. 실현손익 계산 (레버리지 곱하지 않음 — 레버리지 효과는 증거금 비율에 이미 내포)
        //    LONG  실현손익 = (청산가 - 평균진입가) × 청산수량
        //    SHORT 실현손익 = (평균진입가 - 청산가) × 청산수량
        BigDecimal realizedPnl;
        if (positionSide == PositionSide.LONG) {
            realizedPnl = closePrice.subtract(position.getEntryPrice())
                    .multiply(closeQuantity)
                    .setScale(8, RoundingMode.HALF_UP);
        } else {
            realizedPnl = position.getEntryPrice().subtract(closePrice)
                    .multiply(closeQuantity)
                    .setScale(8, RoundingMode.HALF_UP);
        }

        // 7. 청산 수수료 (현재가 × 청산수량 × taker fee)
        BigDecimal closeFee = closePrice.multiply(closeQuantity)
                .multiply(TRADE_FEE)
                .setScale(8, RoundingMode.HALF_UP);

        // 8. 정산금액 = 청산증거금 + 실현손익 - 청산수수료
        BigDecimal settlement = closeMargin.add(realizedPnl).subtract(closeFee);

        // 9. 지갑 정산 (손실이 증거금을 초과하면 0으로 cap — 강제청산 로직 미구현 방어)
        if (settlement.compareTo(BigDecimal.ZERO) > 0) {
            wallet.addMoney(settlement);
        }

        // 10. 포지션 수치 차감 (잔여수량 0이면 CLOSE 상태로 전환)
        position.reduce(closeQuantity, closeMargin, closeNotional, realizedPnl);

        return position;
    }
}
