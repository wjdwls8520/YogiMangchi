package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.futures.dto.request.FuturesLeverageRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesLeverageResponseDto;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesLeverageSettingRepository;
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

        // OPEN 포지션이 있으면 레버리지 변경 검증 및 포지션 갱신
        List<FuturesPosition> openPositions = futuresPositionRepository
                .findAllByAssetsAndSymbolAndPositionStatusForUpdate(wallet, symbol, PositionStatus.OPEN);

        if (!openPositions.isEmpty()) {
            // 현재가 조회 (청산가 안전 여부 판단에 필요)
            BigDecimal currentPrice = new BigDecimal(
                    chartPriceRepository.findBySymbol(symbol)
                            .orElseThrow(() -> new IllegalArgumentException("현재 해당 코인의 시세를 확인할 수 없습니다."))
                            .price()
            );

            for (FuturesPosition position : openPositions) {
                int newLeverage = request.leverage();
                if (newLeverage == position.getLeverage()) continue; // 동일 레버리지면 스킵

                // 새 레버리지 기준 증거금 재계산
                BigDecimal newTotalMargin = position.getNotionalAmount()
                        .divide(BigDecimal.valueOf(newLeverage), 8, RoundingMode.HALF_UP);
                BigDecimal marginDiff = newTotalMargin.subtract(position.getTotalMargin());
                // marginDiff > 0: 레버리지 낮춤 → 추가 증거금 필요
                // marginDiff < 0: 레버리지 올림 → 증거금 일부 반환

                if (newLeverage > position.getLeverage()) {
                    // 레버리지 올릴 때 — 새 청산가가 현재가에 도달하면 예외
                    validateLiquidationSafety(position.getPositionSide(), currentPrice,
                            position.getEntryPrice(), newLeverage);
                    // 남는 증거금 지갑으로 반환 (marginDiff 가 음수이므로 negate)
                    wallet.addMoney(marginDiff.negate());
                } else {
                    // 레버리지 낮출 때 — 추가 증거금 잔고 검증 후 차감
                    if (wallet.getCurrentMoney().compareTo(marginDiff) < 0) {
                        throw new IllegalArgumentException("레버리지를 낮추기 위한 추가 증거금이 부족합니다.");
                    }
                    wallet.subtractMoney(marginDiff);
                }

                // 포지션 레버리지·증거금·청산가 갱신
                position.updateLeverage(newLeverage, newTotalMargin);
            }
        }

        // 행이 없으면 INSERT, 있으면 UPDATE — 단일 원자 연산으로 경쟁 조건 방지
        futuresLeverageSettingRepository.upsertLeverage(wallet.getId(), symbol, request.leverage());

        BigDecimal availableOrderNotionalAmount = wallet.getCurrentMoney()
                .multiply(BigDecimal.valueOf(request.leverage()))
                .divide(BigDecimal.ONE.add(TRADE_FEE.multiply(BigDecimal.valueOf(request.leverage()))), 4, RoundingMode.HALF_DOWN);

        return new FuturesLeverageResponseDto(symbol, request.leverage(), maxLeverage, availableOrderNotionalAmount);
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
    private void validateLiquidationSafety(PositionSide positionSide, BigDecimal currentPrice,
                                            BigDecimal entryPrice, int newLeverage) {
        BigDecimal lev = BigDecimal.valueOf(newLeverage);
        BigDecimal newLiqPrice;

        if (positionSide == PositionSide.LONG) {
            // LONG 청산가 = entryPrice × (1 - 1/leverage)
            newLiqPrice = entryPrice.multiply(BigDecimal.ONE.subtract(
                    BigDecimal.ONE.divide(lev, 8, RoundingMode.HALF_UP)));
            if (currentPrice.compareTo(newLiqPrice) <= 0) {
                throw new IllegalArgumentException("현재가가 새 청산가에 도달하여 레버리지를 올릴 수 없습니다.");
            }
        } else {
            // SHORT 청산가 = entryPrice × (1 + 1/leverage)
            newLiqPrice = entryPrice.multiply(BigDecimal.ONE.add(
                    BigDecimal.ONE.divide(lev, 8, RoundingMode.HALF_UP)));
            if (currentPrice.compareTo(newLiqPrice) >= 0) {
                throw new IllegalArgumentException("현재가가 새 청산가에 도달하여 레버리지를 올릴 수 없습니다.");
            }
        }
    }
}
