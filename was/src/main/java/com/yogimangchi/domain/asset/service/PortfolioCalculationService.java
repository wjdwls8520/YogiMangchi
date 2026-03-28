package com.yogimangchi.domain.asset.service;

import com.yogimangchi.domain.asset.dto.response.HoldingResponseDto;
import com.yogimangchi.domain.asset.dto.response.PortfolioResponseDto;
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
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioCalculationService {

    private final ChartPriceRepository chartPriceRepository;

    // 각 지갑과 보유 코인을 합산 하여 자산 조회
    @Transactional(readOnly = true)
    public PortfolioResponseDto calculatePortfolio(String displayAssetTypeName, List<Assets> wallets, List<Holding> holdings) {

        BigDecimal totalCashBalance = BigDecimal.ZERO;
        BigDecimal totalSeedMoney = BigDecimal.ZERO;

        for (Assets wallet : wallets) {
            totalCashBalance = totalCashBalance.add(wallet.getCurrentMoney());
            totalSeedMoney = totalSeedMoney.add(wallet.getSeedMoney());
        }

        BigDecimal totalCoinValue = BigDecimal.ZERO;
        BigDecimal totalBuyAmount = BigDecimal.ZERO;

        // 내부 구조체 (계산 중간 단계를 캐시하기 위함)
        record HoldingCalc(String symbol, BigDecimal quantity, BigDecimal averageBuyPrice,
                           BigDecimal currentPrice, BigDecimal buyAmount,
                           BigDecimal coinTotalValue, BigDecimal profit, BigDecimal roi, boolean isPriceStale) {}

        List<HoldingCalc> holdingCalcs = new ArrayList<>();

        for (Holding holding : holdings) {
            // 현재 가격 조회
            Optional<ChartPriceDto> priceOpt = chartPriceRepository.findBySymbol(holding.getSymbol());
            boolean isPriceStale = priceOpt.isEmpty();
            BigDecimal currentPrice = priceOpt
                    .map(dto -> new BigDecimal(dto.price()))
                    .orElse(holding.getAverageBuyPrice());

            // 산개별 코인 산술
            BigDecimal coinTotalValue = holding.getQuantity().multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);
            BigDecimal buyAmount = holding.getQuantity().multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
            BigDecimal profit = coinTotalValue.subtract(buyAmount);

            // 개별 코인 수익률(ROI) 계산 - 0% 방지를 위해 미리 100을 곱함
            BigDecimal roi = BigDecimal.ZERO;
            if (buyAmount.compareTo(BigDecimal.ZERO) > 0) {
                roi = profit.multiply(new BigDecimal("100")).divide(buyAmount, 2, RoundingMode.HALF_UP);
            }

            // 계산 결과 임시 저장
            holdingCalcs.add(new HoldingCalc(
                    holding.getSymbol(), holding.getQuantity(), holding.getAverageBuyPrice(),
                    currentPrice, buyAmount, coinTotalValue, profit, roi, isPriceStale
            ));

            // 전체 코인 평가금 및 매수금액 누적
            totalCoinValue = totalCoinValue.add(coinTotalValue);
            totalBuyAmount = totalBuyAmount.add(buyAmount);
        }

        // 포트폴리오 코인의 전체 비중(%) 계산 및 DTO 변환
        List<HoldingResponseDto> holdingResponseDtos = new ArrayList<>();
        for (HoldingCalc calc : holdingCalcs) {
            BigDecimal holdingRatio = BigDecimal.ZERO;

            // 내 전체 코인 자산 중 이 코인이 차지하는 비중(%)
            if (totalCoinValue.compareTo(BigDecimal.ZERO) > 0) {
                holdingRatio = calc.coinTotalValue()
                        .multiply(new BigDecimal("100"))
                        .divide(totalCoinValue, 2, RoundingMode.HALF_UP);
            }

            holdingResponseDtos.add(new HoldingResponseDto(
                    calc.symbol(), calc.quantity(), calc.averageBuyPrice(),
                    calc.currentPrice(), calc.buyAmount(), calc.coinTotalValue(),
                    calc.profit(), calc.roi(), holdingRatio, calc.isPriceStale()
            ));
        }

        // 최종 계좌 총계산 (두 지갑을 더한 전체 자산)
        BigDecimal totalAsset = totalCashBalance.add(totalCoinValue);
        BigDecimal totalProfit = totalAsset.subtract(totalSeedMoney);

        BigDecimal totalRoi = BigDecimal.ZERO;
        if (totalSeedMoney.compareTo(BigDecimal.ZERO) > 0) {
            totalRoi = totalProfit.multiply(new BigDecimal("100")).divide(totalSeedMoney, 2, RoundingMode.HALF_UP);
        }

        return new PortfolioResponseDto(
                displayAssetTypeName, 
                holdingResponseDtos.size(),
                totalSeedMoney,
                totalCashBalance,
                totalBuyAmount,
                totalCoinValue,
                totalAsset,
                totalProfit,
                totalRoi,
                holdingResponseDtos
        );
    }
}
