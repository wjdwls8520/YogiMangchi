package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.futures.dto.request.FuturesLeverageRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesLeverageResponseDto;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesLeverageSettingRepository;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import com.yogimangchi.domain.futures.support.FuturesWalletReader;
import com.yogimangchi.domain.market.entity.FuturesSymbolPolicy;
import com.yogimangchi.domain.market.repository.FuturesSymbolPolicyRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FuturesLeverageService {

    private final FuturesWalletReader futuresWalletReader;
    private final FuturesSymbolPolicyRepository futuresSymbolPolicyRepository;
    private final FuturesLeverageSettingRepository futuresLeverageSettingRepository;
    private final FuturesPositionRepository futuresPositionRepository;
    private final FuturesOrderRepository futuresOrderRepository;
    private final ChartPriceRepository chartPriceRepository;

    private static final BigDecimal TRADE_FEE = new BigDecimal("0.0005");

    @Transactional
    public FuturesLeverageResponseDto setLeverage(Long memberId, Long contestSeasonId, FuturesLeverageRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();

        // 쓰기 트랜잭션 — 비관적 락으로 지갑 조회
        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getTradableRealWallet(memberId)
                : futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);

        // 본투자 지갑은 만료 여부를 별도 검증 (대회 지갑은 쿼리에서 시즌 기간으로 이미 검증)
        if (wallet.getType() == AssetType.TRADE_FUTURE && LocalDateTime.now().isAfter(wallet.getExpiredAt())) {
            throw new IllegalArgumentException("선물 지갑의 이용 기간이 만료되었습니다. 지갑을 다시 생성해주세요.");
        }

        // 선물 지원 심볼 여부 + 레버리지 정책 조회
        FuturesSymbolPolicy policy = futuresSymbolPolicyRepository.findWithMarketSymbolBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("선물 거래를 지원하지 않는 심볼입니다: " + symbol));

        // 지갑 타입에 따라 적용할 최대 레버리지 결정
        int maxLeverage = (wallet.getType() == AssetType.CONTEST)
                ? policy.getContestMaxLeverage()
                : policy.getMaxLeverage();

        // 요청 레버리지 범위 검증
        if (request.leverage() > maxLeverage) {
            throw new IllegalArgumentException(
                    symbol + " 심볼의 최대 레버리지는 " + maxLeverage + "배입니다. (요청값: " + request.leverage() + "배)"
            );
        }

        int newLeverage = request.leverage();

        // OPEN 포지션과 PENDING LIMIT OPEN 주문이 있으면 레버리지 변경 검증 및 마진 동기화
        List<FuturesPosition> openPositions = futuresPositionRepository
                .findAllByAssetsAndSymbolAndPositionStatusForUpdate(wallet, symbol, PositionStatus.OPEN);
        List<FuturesOrder> pendingOpenOrders = futuresOrderRepository.findAllPendingLimitOpenOrders(wallet, symbol);

        BigDecimal totalMarginDiff = BigDecimal.ZERO;
        BigDecimal currentPrice = null;

        for (FuturesPosition position : openPositions) {
            if (newLeverage == position.getLeverage()) {
                continue;
            }

            if (newLeverage > position.getLeverage()) {
                if (currentPrice == null) {
                    currentPrice = new BigDecimal(
                            chartPriceRepository.findBySymbol(symbol)
                                    .orElseThrow(() -> new IllegalArgumentException("현재 해당 코인의 시세를 확인할 수 없습니다."))
                                    .price()
                    );
                }
                validateLiquidationSafety(position.getPositionSide(), currentPrice, position.getEntryPrice(), newLeverage);
            }

            BigDecimal newTotalMargin = position.getNotionalAmount()
                    .divide(BigDecimal.valueOf(newLeverage), 8, RoundingMode.HALF_UP);
            totalMarginDiff = totalMarginDiff.add(newTotalMargin.subtract(position.getTotalMargin()));
        }

        for (FuturesOrder pendingOpenOrder : pendingOpenOrders) {
            BigDecimal newOrderMargin = pendingOpenOrder.getNotionalAmount()
                    .divide(BigDecimal.valueOf(newLeverage), 8, RoundingMode.HALF_UP);
            totalMarginDiff = totalMarginDiff.add(newOrderMargin.subtract(pendingOpenOrder.getOrderMargin()));
        }

        if (totalMarginDiff.compareTo(BigDecimal.ZERO) > 0
                && wallet.getCurrentMoney().compareTo(totalMarginDiff) < 0) {
            throw new IllegalArgumentException("레버리지 변경에 필요한 추가 증거금이 부족합니다.");
        }

        if (totalMarginDiff.compareTo(BigDecimal.ZERO) > 0) {
            wallet.subtractMoney(totalMarginDiff);
        } else if (totalMarginDiff.compareTo(BigDecimal.ZERO) < 0) {
            wallet.addMoney(totalMarginDiff.negate());
        }

        for (FuturesPosition position : openPositions) {
            if (newLeverage == position.getLeverage()) {
                continue;
            }

            BigDecimal newTotalMargin = position.getNotionalAmount()
                    .divide(BigDecimal.valueOf(newLeverage), 8, RoundingMode.HALF_UP);
            position.updateLeverage(newLeverage, newTotalMargin);
        }

        for (FuturesOrder pendingOpenOrder : pendingOpenOrders) {
            BigDecimal newOrderMargin = pendingOpenOrder.getNotionalAmount()
                    .divide(BigDecimal.valueOf(newLeverage), 8, RoundingMode.HALF_UP);
            pendingOpenOrder.updateOrderMargin(newOrderMargin);
        }

        // 행이 없으면 INSERT, 있으면 UPDATE — 단일 원자 연산으로 경쟁 조건 방지
        futuresLeverageSettingRepository.upsertLeverage(wallet.getId(), symbol, newLeverage);

        BigDecimal availableOrderNotionalAmount = wallet.getCurrentMoney()
                .multiply(BigDecimal.valueOf(newLeverage))
                .divide(BigDecimal.ONE.add(TRADE_FEE.multiply(BigDecimal.valueOf(newLeverage))), 4, RoundingMode.HALF_DOWN);

        return new FuturesLeverageResponseDto(symbol, newLeverage, maxLeverage, availableOrderNotionalAmount);
    }

    @Transactional(readOnly = true)
    public FuturesLeverageResponseDto getLeverage(Long memberId, Long contestSeasonId, String symbol) {
        String upperSymbol = symbol.trim().toUpperCase();

        // 읽기 트랜잭션 — 락 없이 지갑 조회
        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getReadableRealWallet(memberId)
                : futuresWalletReader.getReadableContestWallet(memberId, contestSeasonId);

        // 선물 지원 심볼 여부 + 레버리지 정책 조회 (maxLeverage 응답에 필요)
        FuturesSymbolPolicy policy = futuresSymbolPolicyRepository.findWithMarketSymbolBySymbol(upperSymbol)
                .orElseThrow(() -> new IllegalArgumentException("선물 거래를 지원하지 않는 심볼입니다: " + upperSymbol));

        int maxLeverage = (wallet.getType() == AssetType.CONTEST)
                ? policy.getContestMaxLeverage()
                : policy.getMaxLeverage();

        // 설정이 없으면 DB에 저장하지 않고 기본값 1 반환
        int leverage = futuresLeverageSettingRepository
                .findByAssetsAndSymbol(wallet, upperSymbol)
                .map(setting -> setting.getLeverage())
                .orElse(1);

        BigDecimal availableOrderNotionalAmount = wallet.getCurrentMoney()
                .multiply(BigDecimal.valueOf(leverage))
                .divide(BigDecimal.ONE.add(TRADE_FEE.multiply(BigDecimal.valueOf(leverage))), 4, RoundingMode.HALF_DOWN);

        return new FuturesLeverageResponseDto(upperSymbol, leverage, maxLeverage, availableOrderNotionalAmount);
    }

    // 레버리지 올릴 때 — 새 청산가가 현재가에 도달하는지 검증
    // FuturesPosition.calculateLiquidationPrice()와 동일한 공식 사용
    private void validateLiquidationSafety(PositionSide positionSide, BigDecimal currentPrice,
                                            BigDecimal entryPrice, int newLeverage) {
        BigDecimal lev = BigDecimal.valueOf(newLeverage);
        BigDecimal inverseL = BigDecimal.ONE.divide(lev, 8, RoundingMode.HALF_UP);
        BigDecimal newLiqPrice;

        if (positionSide == PositionSide.LONG) {
            // LONG 청산가 = entryPrice × (1 - 1/leverage + 수수료율)
            newLiqPrice = entryPrice.multiply(
                    BigDecimal.ONE.subtract(inverseL).add(TRADE_FEE));
            if (currentPrice.compareTo(newLiqPrice) <= 0) {
                throw new IllegalArgumentException("현재가가 새 청산가에 도달하여 레버리지를 올릴 수 없습니다.");
            }
        } else {
            // SHORT 청산가 = entryPrice × (1 + 1/leverage - 수수료율)
            newLiqPrice = entryPrice.multiply(
                    BigDecimal.ONE.add(inverseL).subtract(TRADE_FEE));
            if (currentPrice.compareTo(newLiqPrice) >= 0) {
                throw new IllegalArgumentException("현재가가 새 청산가에 도달하여 레버리지를 올릴 수 없습니다.");
            }
        }
    }
}
