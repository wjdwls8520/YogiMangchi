package com.yogimangchi.domain.trade.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.market.entity.MarketSymbol;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
import com.yogimangchi.domain.trade.constant.TradeFeePolicy;
import com.yogimangchi.domain.trade.dto.request.MarketOrderRequestDto;
import com.yogimangchi.domain.trade.dto.request.TradeHistorySearchCondition;
import com.yogimangchi.domain.trade.dto.response.CursorResponseDto;
import com.yogimangchi.domain.trade.dto.response.TradeHistoryResponseDto;
import com.yogimangchi.domain.trade.entity.Order;
import com.yogimangchi.domain.trade.entity.TradeHistory;
import com.yogimangchi.domain.trade.repository.OrderRepository;
import com.yogimangchi.domain.trade.repository.TradeHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TradeHistoryService {

    private final ChartPriceRepository chartPriceRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final OrderRepository orderRepository;
    private final TradeHistoryRepository tradeHistoryRepository;
    private final MarketSymbolRepository marketSymbolRepository;

    @Transactional
    public void executeMarketOrder(Long memberId, MarketOrderRequestDto request) {

        if ("BUY".equalsIgnoreCase(request.side()) && request.totalAmount() == null) {
            throw new IllegalArgumentException("매수 시 투자 금액은 필수입니다.");
        }
        if ("SELL".equalsIgnoreCase(request.side()) && request.quantity() == null) {
            throw new IllegalArgumentException("매도 시 수량은 필수입니다.");
        }

        // 거래가능한 코인인지 검증
        MarketSymbol marketSymbol = marketSymbolRepository.findById(request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("거래를 지원하지 않는 코인입니다."));
        if(!marketSymbol.isActive()){
            throw new IllegalArgumentException("현재 거래가 임시 중지 되거나 상장 폐지된 코인입니다.");
        }

        // 현재 바이낸스 실시간 가격 조회
        ChartPriceDto currentPriceDto = chartPriceRepository.findBySymbol(request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("현재 해당 코인의 시세를 확인할 수 없습니다."));
        BigDecimal currentPrice = new BigDecimal(currentPriceDto.price());

        // 최소주문금액 10달러 로직
        BigDecimal MIN_ORDER_AMOUNT = new BigDecimal("10");

        if("BUY".equalsIgnoreCase(request.side())){
            if(request.totalAmount().compareTo(MIN_ORDER_AMOUNT) < 0){
                throw new IllegalArgumentException("최소 주문 금액은 " + MIN_ORDER_AMOUNT + " 달러 이상이어야 합니다.");
            }
        }else if("SELL".equalsIgnoreCase(request.side())){
            BigDecimal sellValue = request.quantity().multiply(currentPrice);
            if (sellValue.compareTo(MIN_ORDER_AMOUNT) < 0) {
                throw new IllegalArgumentException("매도하는 코인의 총 가치가 " + MIN_ORDER_AMOUNT + " 달러 이상이어야 합니다.");
            }
        }

        // 내 지갑 찾기 및 락걸기
        Assets myWallet = assetRepository.findByMemberIdAndTypeAndStatusForUpdate(memberId, request.assetType(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 " + request.assetType() + " 지갑을 찾을 수 없습니다."));

        // 지갑의 기간 만료 검증
        if (LocalDateTime.now().isAfter(myWallet.getExpiredAt())) {
            throw new IllegalArgumentException("해당 콘텐츠의 진행 기간이 만료되어 더 이상 매매할 수 없습니다. 지갑을 다시 생성해주세요.");
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
        BigDecimal orderAmount = request.totalAmount(); // 내가 쓸 현금

        // 체결 전 주문 원장을 먼저 생성
        Order order = orderRepository.save(
                Order.createMarketBuyOrder(wallet, request.symbol(), orderAmount)
        );

        // 1. 수수료 계산 및 실제 매수 금액 산출
        BigDecimal fee = TradeFeePolicy.calculateFee(orderAmount, TradeFeePolicy.MARKET_FEE_RATE);
        BigDecimal actualBuyAmount = orderAmount.subtract(fee); // 실제 매수에 사용되는 금액 = 주문금액 - 수수료

        // 2. 수량 계산 = (실제 매수 금액 / 현재가)
        BigDecimal quantityToBuy = actualBuyAmount.divide(currentPrice, 8, RoundingMode.HALF_UP);

        // 3. 지갑에서 돈 빼기 (수수료 포함 전체 금액 차감)
        wallet.subtractMoney(orderAmount);

        // 4. 내 코인(Holding) 지갑에 추가 (또는 물타기 평단가 계산)
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

        // 영수증은 체결된 주문과 함께 기록한다
        TradeHistory history = TradeHistory.createMarketBuyHistory(
                wallet, order, request.symbol(), currentPrice, quantityToBuy, orderAmount, fee
        );
        tradeHistoryRepository.save(history);

        // 시장가 주문은 생성 즉시 전량 체결로 상태를 마감
        order.completeOrder(
                quantityToBuy,
                currentPrice,
                orderAmount,
                fee,
                history.getExecutedAt()
        );

        log.info("[매수 완료] 유저: {}, 코인: {}, 금액: {}, 수수료: {}, 체결수량: {}", wallet.getMember().getId(), request.symbol(), orderAmount, fee, quantityToBuy);
    }

    // 시장가 매도(SELL) 로직
    private void processMarketSell(Assets wallet, MarketOrderRequestDto request, BigDecimal currentPrice) {
        BigDecimal sellQuantity = request.quantity(); // 팔고자 하는 코인 수량

        // 체결 전 주문 원장을 먼저 생성
        Order order = orderRepository.save(
                Order.createMarketSellOrder(wallet, request.symbol(), sellQuantity)
        );

        // 1. 내가 진짜로 그만큼 코인을 가지고 있는지 확인
        Holding holding = holdingRepository.findByAssetsAndSymbol(wallet, request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("해당 코인을 보유하고 있지 않습니다."));

        if (holding.getQuantity().compareTo(sellQuantity) < 0) {
            throw new IllegalArgumentException("보유 수량이 부족합니다.");
        }

        // 2. 총 매도 대금 = (팔 수량 * 현재가) -> 소수점 4자리까지
        BigDecimal totalAmountEarned = sellQuantity.multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);

        // 3. 수수료 계산 및 실수령액 산출
        BigDecimal fee = TradeFeePolicy.calculateFee(totalAmountEarned, TradeFeePolicy.MARKET_FEE_RATE);
        BigDecimal actualReceived = totalAmountEarned.subtract(fee); // 실수령액 = 매도대금 - 수수료

        // 4. 실현 수익 계산하기 (수수료 반영)
        // 내가 구매한 원금(판 수량 * 내 평단가)
        BigDecimal originalCost = sellQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);

        // 실현 수익 = (실수령액 - 원금)
        BigDecimal realizedProfit = actualReceived.subtract(originalCost);

        // 5. 지갑에 수수료를 뺀 금액만 입금
        wallet.addMoney(actualReceived);

        // 6. 코인 수량 깎기 (만약 다 팔았다면 평단가는 유지하거나, 0으로 만들거나 비즈니스 정책에 따름)
        BigDecimal remainQuantity = holding.getQuantity().subtract(sellQuantity);
        holding.updateHolding(remainQuantity, holding.getAverageBuyPrice());

        // 영수증은 체결된 주문과 함께 기록한다
        TradeHistory history = TradeHistory.createMarketSellHistory(
                wallet, order, request.symbol(), currentPrice, sellQuantity, totalAmountEarned, fee, realizedProfit
        );
        tradeHistoryRepository.save(history);

        // 시장가 주문은 생성 즉시 전량 체결로 상태를 마감
        order.completeOrder(
                sellQuantity,
                currentPrice,
                totalAmountEarned,
                fee,
                history.getExecutedAt()
        );

        log.info("[매도 완료] 유저: {}, 코인: {}, 수량: {}, 매도대금: {}, 수수료: {}, 실수령액: {}", wallet.getMember().getId(), request.symbol(), sellQuantity, totalAmountEarned, fee, actualReceived);
    }


    // 무한 스크롤 + 동적 필터가 적용된 매매 영수증 조회 기능
    @Transactional(readOnly = true)
    public CursorResponseDto<TradeHistoryResponseDto> getTradeHistories(Long memberId, TradeHistorySearchCondition cond) {

        Long assetId = null;
        if (cond.assetType() == AssetType.MOCK) {
            assetId = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                    .map(Assets::getId)
                    .orElseThrow(() -> new IllegalArgumentException("현재 참여중인 모의투자 계좌가 존재하지 않습니다."));
        }

        // 1. QueryDSL 레포지토리 호출 (요청 사이즈 + 1 개를 가져옴)
        List<TradeHistory> histories = tradeHistoryRepository.searchTradeHistories(memberId, cond, assetId);

        // 2. hasNext(다음 페이지 존재 여부) 파악
        int limitSize = cond.getOrDefaultSize();
        boolean hasNext = histories.size() > limitSize; // 21개를 가져왔다면 다음 페이지가 있다는 뜻!

        // 3. 만약 다음 페이지가 있다면, 몰래 1개 더 가져왔던 마지막 녀석은 리스트에서 빼버림 (프론트엔드엔 안 줌)
        if (hasNext) {
            histories.remove(limitSize);
        }

        // 4. 다음 페이지 조회를 위한 '커서 ID(마지막 영수증 번호)' 구하기
        Long nextCursorId = null;
        if (!histories.isEmpty()) {
            nextCursorId = histories.get(histories.size() - 1).getId();
        }

        // 5. Entity -> DTO 변환 (이전에 만들어둔 DTO의 from 메서드 사용)
        List<TradeHistoryResponseDto> content = histories.stream()
                .map(history -> TradeHistoryResponseDto.from(history, resolveDisplayNameKr(history.getSymbol())))
                .toList();

        // 6. 예쁘게 포장해서 반환
        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }

    // 영수증에서도 심볼 대신 한글 코인명을 함께 보여줄 수 있도록 내려준다
    private String resolveDisplayNameKr(String symbol) {
        return marketSymbolRepository.findById(symbol)
                .map(MarketSymbol::getDisplayNameKr)
                .orElse(symbol);
    }


}
