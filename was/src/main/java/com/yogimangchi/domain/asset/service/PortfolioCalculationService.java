package com.yogimangchi.domain.asset.service;

import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.dto.response.HoldingResponseDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioCalculationService {

    private final ChartPriceRepository chartPriceRepository;

    /**
     * 자산 상세 API와 프로필 API가 함께 재사용하는 공용 포트폴리오 계산 메서드다.
     * 지갑 현금 잔고, 보유 코인, 실시간 가격을 합쳐 총자산/손익/비중 응답을 만든다.
     * holdingRatio 는 "코인 내부 비중"이 아니라 "현금을 포함한 총 자산 대비 코인 비중" 기준으로 계산한다.
     * 실시간 가격은 종목별로 반복 조회하지 않고 한 번에 모아 읽어, 이번 요청 안에서는 같은 가격 집합으로 계산한다.
     */
    @Transactional(readOnly = true)
    public AssetPortfolioDetailResponseDto calculatePortfolio(String displayAssetTypeName, List<Assets> wallets, List<Holding> holdings) {

        BigDecimal totalCashBalance = BigDecimal.ZERO;
        BigDecimal totalLockedMoney = BigDecimal.ZERO;
        BigDecimal totalSeedMoney = BigDecimal.ZERO;

        for (Assets wallet : wallets) {
            totalCashBalance = totalCashBalance.add(wallet.getCurrentMoney());
            totalLockedMoney = totalLockedMoney.add(wallet.getLockedMoney());
            totalSeedMoney = totalSeedMoney.add(wallet.getSeedMoney());
        }

        BigDecimal totalCashAsset = totalCashBalance.add(totalLockedMoney);
        BigDecimal totalCoinValue = BigDecimal.ZERO;
        BigDecimal totalBuyAmount = BigDecimal.ZERO;
        Map<String, ChartPriceDto> latestPricesBySymbol = chartPriceRepository.findAllBySymbols(
                        holdings.stream()
                                .map(Holding::getSymbol)
                                .distinct()
                                .toList()
                ).stream()
                .collect(Collectors.toMap(
                        price -> price.symbol().toUpperCase(),
                        Function.identity()
                ));

        // 내부 구조체 (계산 중간 단계를 캐시하기 위함)
        record HoldingCalc(String symbol, BigDecimal totalQuantity, BigDecimal availableQuantity, BigDecimal lockedQuantity,
                           BigDecimal averageBuyPrice,
                           BigDecimal currentPrice, BigDecimal buyAmount,
                           BigDecimal coinTotalValue, BigDecimal profit, BigDecimal roi, boolean isPriceStale) {}

        List<HoldingCalc> holdingCalcs = new ArrayList<>();

        for (Holding holding : holdings) {
            // 이번 요청에서 사용할 가격 집합을 먼저 확보해 두고 그 기준으로 계산한다.
            ChartPriceDto priceDto = latestPricesBySymbol.get(holding.getSymbol().toUpperCase());
            boolean isPriceStale = priceDto == null;
            BigDecimal currentPrice = priceDto != null
                    ? new BigDecimal(priceDto.price())
                    : holding.getAverageBuyPrice();

            BigDecimal availableQuantity = holding.getQuantity();
            BigDecimal lockedQuantity = holding.getLockedQuantity();
            BigDecimal totalQuantity = availableQuantity.add(lockedQuantity);

            // 산개별 코인 산술
            BigDecimal coinTotalValue = totalQuantity.multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);
            BigDecimal buyAmount = totalQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
            BigDecimal profit = coinTotalValue.subtract(buyAmount);

            // 개별 코인 수익률(ROI) 계산 - 0% 방지를 위해 미리 100을 곱함
            BigDecimal roi = BigDecimal.ZERO;
            if (buyAmount.compareTo(BigDecimal.ZERO) > 0) {
                roi = profit.multiply(new BigDecimal("100")).divide(buyAmount, 2, RoundingMode.HALF_UP);
            }

            // 계산 결과 임시 저장
            holdingCalcs.add(new HoldingCalc(
                    holding.getSymbol(), totalQuantity, availableQuantity, lockedQuantity, holding.getAverageBuyPrice(),
                    currentPrice, buyAmount, coinTotalValue, profit, roi, isPriceStale
            ));

            // 전체 코인 평가금 및 매수금액 누적
            totalCoinValue = totalCoinValue.add(coinTotalValue);
            totalBuyAmount = totalBuyAmount.add(buyAmount);
        }

        BigDecimal totalAsset = totalCashAsset.add(totalCoinValue);
        BigDecimal totalProfit = totalAsset.subtract(totalSeedMoney);

        BigDecimal totalRoi = BigDecimal.ZERO;
        if (totalSeedMoney.compareTo(BigDecimal.ZERO) > 0) {
            totalRoi = totalProfit.multiply(new BigDecimal("100")).divide(totalSeedMoney, 2, RoundingMode.HALF_UP);
        }

        // 총 자산 기준 코인 비중(%) 계산 및 DTO 변환
        List<HoldingResponseDto> holdingResponseDtos = new ArrayList<>();
        for (HoldingCalc calc : holdingCalcs) {
            BigDecimal holdingRatio = BigDecimal.ZERO;

            // 내 총 자산 중 이 코인이 차지하는 비중(%)
            if (totalAsset.compareTo(BigDecimal.ZERO) > 0) {
                holdingRatio = calc.coinTotalValue()
                        .multiply(new BigDecimal("100"))
                        .divide(totalAsset, 2, RoundingMode.HALF_UP);
            }

            holdingResponseDtos.add(new HoldingResponseDto(
                    calc.symbol(), calc.totalQuantity(), calc.availableQuantity(), calc.lockedQuantity(), calc.averageBuyPrice(),
                    calc.currentPrice(), calc.buyAmount(), calc.coinTotalValue(),
                    calc.profit(), calc.roi(), holdingRatio, calc.isPriceStale()
            ));
        }

        return new AssetPortfolioDetailResponseDto(
                displayAssetTypeName, 
                holdingResponseDtos.size(),
                totalSeedMoney,
                totalCashBalance,
                totalLockedMoney,
                totalCashAsset,
                totalBuyAmount,
                totalCoinValue,
                totalAsset,
                totalProfit,
                totalRoi,
                holdingResponseDtos
        );
    }
}
