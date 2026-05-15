package com.yogimangchi.domain.asset.service;

import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.dto.response.FuturesPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.dto.response.FuturesPositionDetailDto;
import com.yogimangchi.domain.asset.dto.response.HoldingResponseDto;
import com.yogimangchi.domain.asset.dto.response.RealAssetUnifiedResponseDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PortfolioCalculationService {

    private final ChartPriceRepository chartPriceRepository;

    // ------------------------------------------------------------------------
    // [현물 단독 조회용 메서드]
    // 모의투자나, 기존의 현물 자산만 단독으로 조회할 때 호출되는 퍼블릭 메서드입니다.
    // 내부적으로 코인 심볼들을 모아 실시간 시세를 1번만 조회한 뒤, 내부 계산 메서드로 넘깁니다.
    // ------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public AssetPortfolioDetailResponseDto calculatePortfolio(String displayAssetTypeName, List<Assets> wallets, List<Holding> holdings) {
        // 1. 보유 중인 코인들의 심볼만 추출하여 중복을 제거합니다.
        Map<String, ChartPriceDto> latestPricesBySymbol = chartPriceRepository.findAllBySymbols(
                        holdings.stream()
                                .map(Holding::getSymbol)
                                .distinct()
                                .toList()
                ).stream()
                // 2. 조회된 가격 정보를 심볼(대문자)을 키로 갖는 Map으로 변환합니다.
                .collect(Collectors.toMap(
                        price -> price.symbol().toUpperCase(),
                        Function.identity()
                ));

        // 3. 실제 계산 로직이 담긴 내부 메서드에 가격 Map을 함께 넘겨줍니다.
        return calculatePortfolioInternal(displayAssetTypeName, wallets, holdings, latestPricesBySymbol);
    }

    // ------------------------------------------------------------------------
    // [현물 자산 실질 계산 메서드]
    // 외부에서 주입받은 시세(latestPricesBySymbol)를 바탕으로 현물 지갑의 총자산과 손익을 계산합니다.
    // 통합 자산 조회 시에도 현물 부분 계산을 위해 이 메서드가 재사용됩니다.
    // ------------------------------------------------------------------------
    private AssetPortfolioDetailResponseDto calculatePortfolioInternal(String displayAssetTypeName, List<Assets> wallets, List<Holding> holdings, Map<String, ChartPriceDto> latestPricesBySymbol) {
        BigDecimal totalCashBalance = BigDecimal.ZERO;
        BigDecimal totalLockedMoney = BigDecimal.ZERO;
        BigDecimal totalSeedMoney = BigDecimal.ZERO;

        // 1. 지갑(들)의 가용 현금, 잠긴 현금, 시드머니를 모두 합산합니다.
        for (Assets wallet : wallets) {
            totalCashBalance = totalCashBalance.add(wallet.getCurrentMoney());
            totalLockedMoney = totalLockedMoney.add(wallet.getLockedMoney());
            totalSeedMoney = totalSeedMoney.add(wallet.getSeedMoney());
        }

        BigDecimal totalCashAsset = totalCashBalance.add(totalLockedMoney);
        BigDecimal totalCoinValue = BigDecimal.ZERO;
        BigDecimal totalBuyAmount = BigDecimal.ZERO;

        // 임시 저장용 구조체: 총자산이 나와야 각 코인의 비중(%)을 구할 수 있으므로 1차 계산 결과를 담아둡니다.
        record HoldingCalc(String symbol, BigDecimal totalQuantity, BigDecimal availableQuantity, BigDecimal lockedQuantity,
                           BigDecimal averageBuyPrice,
                           BigDecimal currentPrice, BigDecimal buyAmount,
                           BigDecimal coinTotalValue, BigDecimal profit, BigDecimal roi, boolean isPriceStale) {}

        List<HoldingCalc> holdingCalcs = new ArrayList<>();

        // 2. 보유 코인별로 평가 금액과 수익률을 계산합니다.
        for (Holding holding : holdings) {
            ChartPriceDto priceDto = latestPricesBySymbol.get(holding.getSymbol().toUpperCase());
            boolean isPriceStale = priceDto == null;
            // 시세가 없으면(Stale) 임시로 진입가를 현재가로 사용합니다.
            BigDecimal currentPrice = priceDto != null
                    ? new BigDecimal(priceDto.price())
                    : holding.getAverageBuyPrice();

            BigDecimal availableQuantity = holding.getQuantity();
            BigDecimal lockedQuantity = holding.getLockedQuantity();
            BigDecimal totalQuantity = availableQuantity.add(lockedQuantity);

            // 평가금액 = 총수량 * 현재가
            BigDecimal coinTotalValue = totalQuantity.multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);
            // 매수금액 = 총수량 * 평단가
            BigDecimal buyAmount = totalQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
            // 평가손익 = 평가금액 - 매수금액
            BigDecimal profit = coinTotalValue.subtract(buyAmount);

            // 수익률(ROI) = (평가손익 / 매수금액) * 100
            BigDecimal roi = BigDecimal.ZERO;
            if (buyAmount.compareTo(BigDecimal.ZERO) > 0) {
                roi = profit.multiply(new BigDecimal("100")).divide(buyAmount, 2, RoundingMode.HALF_UP);
            }

            holdingCalcs.add(new HoldingCalc(
                    holding.getSymbol(), totalQuantity, availableQuantity, lockedQuantity, holding.getAverageBuyPrice(),
                    currentPrice, buyAmount, coinTotalValue, profit, roi, isPriceStale
            ));

            totalCoinValue = totalCoinValue.add(coinTotalValue);
            totalBuyAmount = totalBuyAmount.add(buyAmount);
        }

        // 3. 지갑 전체의 총 자산 및 총 손익을 계산합니다.
        BigDecimal totalAsset = totalCashAsset.add(totalCoinValue);
        BigDecimal totalProfit = totalAsset.subtract(totalSeedMoney);

        BigDecimal totalRoi = BigDecimal.ZERO;
        if (totalSeedMoney.compareTo(BigDecimal.ZERO) > 0) {
            totalRoi = totalProfit.multiply(new BigDecimal("100")).divide(totalSeedMoney, 2, RoundingMode.HALF_UP);
        }

        // 4. 총 자산이 계산되었으므로, 각 코인이 내 전체 자산에서 차지하는 비중(%)을 마저 계산하여 DTO를 완성합니다.
        List<HoldingResponseDto> holdingResponseDtos = new ArrayList<>();
        for (HoldingCalc calc : holdingCalcs) {
            BigDecimal holdingRatio = BigDecimal.ZERO;

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

    // ------------------------------------------------------------------------
    // [선물 자산 계산 메서드]
    // 선물 지갑과 포지션 목록을 바탕으로 선물 자산 상태(증거금, 포지션별 PnL 등)를 계산합니다.
    // ------------------------------------------------------------------------
    public FuturesPortfolioDetailResponseDto calculateFutures(List<Assets> wallets, List<FuturesPosition> positions, Map<String, ChartPriceDto> latestPricesBySymbol) {
        BigDecimal cashBalance = BigDecimal.ZERO;
        BigDecimal lockedMoney = BigDecimal.ZERO;

        // 1. 선물 지갑의 가용 현금과 잠긴 현금 합산
        for (Assets wallet : wallets) {
            cashBalance = cashBalance.add(wallet.getCurrentMoney());
            lockedMoney = lockedMoney.add(wallet.getLockedMoney());
        }
        BigDecimal totalCashAsset = cashBalance.add(lockedMoney);

        BigDecimal totalMargin = BigDecimal.ZERO;
        BigDecimal totalUnrealizedPnl = BigDecimal.ZERO;

        List<FuturesPositionDetailDto> positionDtos = new ArrayList<>();

        // 2. 포지션별 미실현 손익 및 증거금 계산
        for (FuturesPosition position : positions) {
            ChartPriceDto priceDto = latestPricesBySymbol.get(position.getSymbol().toUpperCase());
            boolean isPriceStale = priceDto == null;
            BigDecimal currentPrice = priceDto != null ? new BigDecimal(priceDto.price()) : position.getEntryPrice();

            BigDecimal quantity = position.getFilledQuantity();
            BigDecimal entryPrice = position.getEntryPrice();
            BigDecimal margin = position.getTotalMargin();

            BigDecimal unrealizedPnl;
            // 롱(LONG) 포지션: (현재가 - 진입가) * 수량
            if (position.getPositionSide() == PositionSide.LONG) {
                unrealizedPnl = currentPrice.subtract(entryPrice).multiply(quantity).setScale(4, RoundingMode.HALF_UP);
            } 
            // 숏(SHORT) 포지션: (진입가 - 현재가) * 수량
            else {
                unrealizedPnl = entryPrice.subtract(currentPrice).multiply(quantity).setScale(4, RoundingMode.HALF_UP);
            }

            // 수익률(ROE) = (미실현손익 / 투입증거금) * 100
            BigDecimal roi = BigDecimal.ZERO;
            if (margin.compareTo(BigDecimal.ZERO) > 0) {
                roi = unrealizedPnl.multiply(new BigDecimal("100")).divide(margin, 2, RoundingMode.HALF_UP);
            }

            totalMargin = totalMargin.add(margin);
            totalUnrealizedPnl = totalUnrealizedPnl.add(unrealizedPnl);

            positionDtos.add(new FuturesPositionDetailDto(
                    position.getSymbol(),
                    position.getPositionSide(),
                    position.getLeverage(),
                    quantity,
                    entryPrice,
                    currentPrice,
                    margin,
                    position.getLiquidationPrice(),
                    unrealizedPnl,
                    roi,
                    isPriceStale
            ));
        }

        // 3. 선물 총 자산 = 가용/잠긴 현금 + 투입된 증거금 합계 + 미실현 손익 합계
        BigDecimal totalAsset = totalCashAsset.add(totalMargin).add(totalUnrealizedPnl);

        return new FuturesPortfolioDetailResponseDto(
                cashBalance,
                lockedMoney,
                totalCashAsset,
                totalMargin,
                totalUnrealizedPnl,
                totalAsset,
                positionDtos
        );
    }

    // ------------------------------------------------------------------------
    // [통합 자산(현물+선물) 계산 메서드] (🌟 Snapshot 동기화 핵심 로직)
    // 본투자 진입 시 현물 지갑과 선물 지갑을 합쳐서 단일 응답으로 내려줄 때 사용합니다.
    // ------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public RealAssetUnifiedResponseDto calculateUnifiedPortfolio(Assets spotWallet, List<Holding> holdings, Assets futuresWallet, List<FuturesPosition> positions) {
        // 1. 현물과 선물에서 보유 중인 모든 코인 심볼을 하나의 Set으로 취합합니다. (중복 요청 방지)
        Set<String> symbols = new HashSet<>();
        holdings.forEach(h -> symbols.add(h.getSymbol().toUpperCase()));
        positions.forEach(p -> symbols.add(p.getSymbol().toUpperCase()));

        // 2. 통합된 심볼 리스트로 DB/API에서 현재가를 딱 한 번만 조회하여 가격 Map을 만듭니다.
        // 이렇게 하면 현물 계산 시점과 선물 계산 시점의 미세한 가격 불일치를 완벽하게 방어할 수 있습니다.
        Map<String, ChartPriceDto> latestPricesBySymbol = chartPriceRepository.findAllBySymbols(new ArrayList<>(symbols))
                .stream()
                .collect(Collectors.toMap(
                        price -> price.symbol().toUpperCase(),
                        Function.identity()
                ));

        // 3. 만들어둔 가격 Map을 넘겨주어 현물과 선물 포트폴리오를 각각 정확히 계산합니다.
        AssetPortfolioDetailResponseDto spotDto = calculatePortfolioInternal("TRADE_SPOT", List.of(spotWallet), holdings, latestPricesBySymbol);
        FuturesPortfolioDetailResponseDto futuresDto = calculateFutures(List.of(futuresWallet), positions, latestPricesBySymbol);

        // 4. 현물의 총자산과 선물의 총자산을 합쳐 유저의 '진짜 총 자산'을 도출합니다.
        BigDecimal totalAsset = spotDto.totalAsset().add(futuresDto.totalAsset());
        BigDecimal totalSeedMoney = spotWallet.getSeedMoney().add(futuresWallet.getSeedMoney());
        BigDecimal totalProfit = totalAsset.subtract(totalSeedMoney);

        // 5. 통합 DTO로 포장하여 반환합니다.
        return new RealAssetUnifiedResponseDto(
                totalAsset,
                totalProfit,
                spotDto,
                futuresDto
        );
    }
}
