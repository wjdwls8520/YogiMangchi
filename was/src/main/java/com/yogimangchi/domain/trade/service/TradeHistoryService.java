package com.yogimangchi.domain.trade.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.trade.dto.request.MarketOrderRequestDto;
import com.yogimangchi.domain.trade.entity.TradeHistory;
import com.yogimangchi.domain.trade.repository.TradeHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TradeHistoryService {

    private final ChartPriceRepository chartPriceRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final TradeHistoryRepository tradeHistoryRepository;

    @Transactional
    public void executeMarketOrder(Long memberId, MarketOrderRequestDto request) {

        if ("BUY".equalsIgnoreCase(request.side()) && request.totalAmount() == null) {
            throw new IllegalArgumentException("매수 시 투자 금액은 필수입니다.");
        }
        if ("SELL".equalsIgnoreCase(request.side()) && request.quantity() == null) {
            throw new IllegalArgumentException("매도 시 수량은 필수입니다.");
        }

        // 현재 바이낸스 실시간 가격 조회
        ChartPriceDto currentPriceDto = chartPriceRepository.findBySymbol(request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("현재 해당 코인의 시세를 확인할 수 없습니다."));
        BigDecimal currentPrice = new BigDecimal(currentPriceDto.price());

        // 내 지갑 찾기 및 락걸기
        Assets myWallet = assetRepository.findByMemberIdAndTypeAndStatusForUpdate(memberId, request.assetType(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 " + request.assetType() + " 지갑을 찾을 수 없습니다."));

        // 지갑의 기간 만료 검증
        if (LocalDateTime.now().isAfter(myWallet.getExpiredAt())) {
            throw new IllegalArgumentException("해당 콘텐츠의 진행 기간이 만료되어 더 이상 매매할 수 없습니다. 포기 후 재도전해주세요.");
        }

        // 매수 / 매도 분기 처리
        if ("BUY".equalsIgnoreCase(request.side())) {
            processMarketBuy(myWallet, request, currentPrice);
        } else if ("SELL".equalsIgnoreCase(request.side())) {
            processMarketSell(myWallet, request, currentPrice);
        } else {
            throw new IllegalArgumentException("지원하지 않는 매매 방향입니다.");
        }
    }

    // 시장가 매수(BUY) 로직
    private void processMarketBuy(Assets wallet, MarketOrderRequestDto request, BigDecimal currentPrice) {
        BigDecimal orderAmount = request.totalAmount(); // 내가 쓸 현금 (예: 10만 원)

        // 1. 수량 계산 = (투자 금액 / 현재가)
        BigDecimal quantityToBuy = orderAmount.divide(currentPrice, 8, RoundingMode.HALF_UP);

        // 2. 지갑에서 돈 빼기 (잔고 부족하면 Assets 엔티티 내부에서 에러 던짐)
        wallet.subtractMoney(orderAmount);

        // 3. 내 코인(Holding) 지갑에 추가 (또는 물타기 평단가 계산)
        Holding holding = holdingRepository.findByAssetsAndSymbol(wallet, request.symbol())
                .orElse(null);

        if (holding == null) {
            // 처음 사는 코인이면 새로 생성 (이전에 만든 정적 팩토리 메서드 활용)
            Holding newHolding = Holding.createFirstHolding(wallet, request.symbol(), quantityToBuy, currentPrice);
            holdingRepository.save(newHolding);
        } else {
            // 이미 있는 코인이면 수량과 평단가를 업데이트 (물타기 로직)
            // 1. 과거에 내가 샀던 총액 구하기 (기존 개수 × 기존 평단가)
            BigDecimal totalOldValue = holding.getQuantity().multiply(holding.getAverageBuyPrice());
            // 2. 이번에 새로 산 총액 구하기 (새로 산 개수 × 현재 가격)
            BigDecimal totalNewValue = quantityToBuy.multiply(currentPrice);
            // 3. 내 지갑에 들어갈 '총 코인 개수' 합치기
            BigDecimal updatedQuantity = holding.getQuantity().add(quantityToBuy);
            // 4. 새로운 평단가 구하기 = (과거 총액 + 현재 총액) ÷ 총 코인 개수
            BigDecimal updatedAvgPrice = (totalOldValue.add(totalNewValue)).divide(updatedQuantity, 4, RoundingMode.HALF_UP);

            holding.updateHolding(updatedQuantity, updatedAvgPrice);
        }

        // 4. 영수증(TradeHistory) 남기기
        TradeHistory history = TradeHistory.createMarketBuyHistory(
                wallet, request.symbol(), currentPrice, quantityToBuy, orderAmount, BigDecimal.ZERO
        );
        tradeHistoryRepository.save(history);

        log.info("[매수 완료] 유저: {}, 코인: {}, 금액: {}, 체결수량: {}", wallet.getMember().getId(), request.symbol(), orderAmount, quantityToBuy);
    }

    // 시장가 매도(SELL) 로직
    private void processMarketSell(Assets wallet, MarketOrderRequestDto request, BigDecimal currentPrice) {
        BigDecimal sellQuantity = request.quantity(); // 팔고자 하는 코인 수량

        // 1. 내가 진짜로 그만큼 코인을 가지고 있는지 확인
        Holding holding = holdingRepository.findByAssetsAndSymbol(wallet, request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("해당 코인을 보유하고 있지 않습니다."));

        if (holding.getQuantity().compareTo(sellQuantity) < 0) {
            throw new IllegalArgumentException("보유 수량이 부족합니다.");
        }

        // 2. 총 획득 현금 = (팔 수량 * 현재가) -> 소수점 4자리까지
        BigDecimal totalAmountEarned = sellQuantity.multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);

        // 3. 실현 수익 계산하기
        // 내가 구매한 원금(판 수량 * 내 평단가)
        BigDecimal originalCost = sellQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);

        // 실현 수익 = (총 획득 현금 - 원금)
        BigDecimal realizedProfit = totalAmountEarned.subtract(originalCost);

        // 4. 지갑에 돈 더해주기
        wallet.addMoney(totalAmountEarned);

        // 5. 코인 수량 깎기 (만약 다 팔았다면 평단가는 유지하거나, 0으로 만들거나 비즈니스 정책에 따름)
        BigDecimal remainQuantity = holding.getQuantity().subtract(sellQuantity);
        holding.updateHolding(remainQuantity, holding.getAverageBuyPrice());

        // 6. 영수증(TradeHistory) 남기기 (실현 수익 계산 추가 필요)
        TradeHistory history = TradeHistory.createMarketSellHistory(
                wallet, request.symbol(), currentPrice, sellQuantity, totalAmountEarned, BigDecimal.ZERO, realizedProfit
        );
        tradeHistoryRepository.save(history);

        log.info("[매도 완료] 유저: {}, 코인: {}, 수량: {}, 획득금액: {}", wallet.getMember().getId(), request.symbol(), sellQuantity, totalAmountEarned);
    }



}
