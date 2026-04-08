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
import com.yogimangchi.domain.notification.service.NotificationService;
import com.yogimangchi.domain.trade.constant.TradeFeePolicy;
import com.yogimangchi.domain.trade.dto.query.TradeHistoryQueryDto;
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
    private final NotificationService notificationService;

    @Transactional
    public void executeMarketOrder(Long memberId, MarketOrderRequestDto request) {

        if ("BUY".equalsIgnoreCase(request.side()) && request.totalAmount() == null) {
            throw new IllegalArgumentException("매수 시 주문 금액은 필수입니다.");
        }
        if ("SELL".equalsIgnoreCase(request.side()) && request.quantity() == null) {
            throw new IllegalArgumentException("매도 시 주문 수량은 필수입니다.");
        }

        // 거래가능한 코인인지 검증
        MarketSymbol marketSymbol = marketSymbolRepository.findById(request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("거래를 지원하지 않는 코인입니다."));
        if (!marketSymbol.isActive()) {
            throw new IllegalArgumentException("현재 거래가 일시 중지되었거나 상장 폐지된 코인입니다.");
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
            throw new IllegalArgumentException("해당 컨텐츠의 진행 기간이 만료되어 더 이상 매매할 수 없습니다. 지갑을 다시 생성해주세요.");
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
        BigDecimal orderAmount = request.totalAmount(); // 사용자가 입력한 총 지출 금액(수수료 포함)

        // 체결 전 주문 원장을 먼저 생성
        Order order = orderRepository.save(
                Order.createMarketBuyOrder(wallet, request.symbol(), orderAmount)
        );

        // 총 지출 금액에서 수수료를 분리해 실제 체결 원금을 계산한다.
        BigDecimal fee = TradeFeePolicy.calculateFee(orderAmount, TradeFeePolicy.MARKET_FEE_RATE);
        BigDecimal executedAmount = orderAmount.subtract(fee);

        // 체결 수량은 수수료를 제외한 실제 체결 원금 기준이다.
        BigDecimal quantityToBuy = executedAmount.divide(currentPrice, 8, RoundingMode.HALF_UP);

        // 지갑에서는 실제 정산 금액(원금 + 수수료)만큼 차감된다.
        wallet.subtractMoney(orderAmount);

        // 내 코인(Holding) 지갑에 추가 (또는 물타기 평단가 계산)
        Holding holding = holdingRepository.findByAssetsAndSymbol(wallet, request.symbol())
                .orElse(null);

        if (holding == null) {
            // 처음 사는 코인이면 새로 생성
            BigDecimal averageBuyPrice = executedAmount.divide(quantityToBuy, 8, RoundingMode.HALF_UP);
            Holding newHolding = Holding.createFirstHolding(wallet, request.symbol(), quantityToBuy, averageBuyPrice);
            holdingRepository.save(newHolding);
        } else {
            // 이미 있는 코인이면 수량과 평단가를 업데이트 (물타기 로직)
            // 1. 과거에 내가 샀던 총액 구하기 (기존 개수 × 기존 평단가)
            BigDecimal totalOldValue = holding.getQuantity().multiply(holding.getAverageBuyPrice());
            // 이번에 새로 산 총액 구하기 (새로 산 개수 × 현재 가격)이번에 새로 산 총액 구하기 (새로 산 개수 × 현재 가격)
            BigDecimal totalNewValue = executedAmount;
            // 내 지갑에 들어갈 '총 코인 개수' 합치기
            BigDecimal updatedQuantity = holding.getQuantity().add(quantityToBuy);
            // 새로운 평단가 구하기 = (과거 총액 + 현재 총액) ÷ 총 코인 개수
            BigDecimal updatedAvgPrice = (totalOldValue.add(totalNewValue)).divide(updatedQuantity, 4, RoundingMode.HALF_UP);

            holding.updateHolding(updatedQuantity, updatedAvgPrice);
        }

        // 영수증은 체결된 주문과 함께 기록한다
        TradeHistory history = TradeHistory.createMarketBuyHistory(
                wallet, order, request.symbol(), currentPrice, quantityToBuy, executedAmount, fee
        );
        tradeHistoryRepository.save(history);

        order.completeOrder(
                quantityToBuy,
                currentPrice,
                executedAmount,
                fee,
                history.getExecutedAt()
        );
        // 시장가 체결 완료 후 알림 생성 및 실시간 전송 로직
        notificationService.notifyOrderCompleted(wallet.getMember(), wallet.getType(), order);

        log.info("[매수 완료] 유저: {}, 코인: {}, 총지출: {}, 체결원금: {}, 수수료: {}, 체결수량: {}",
                wallet.getMember().getId(), request.symbol(), orderAmount, executedAmount, fee, quantityToBuy);
    }

    // 시장가 매도(SELL) 로직
    private void processMarketSell(Assets wallet, MarketOrderRequestDto request, BigDecimal currentPrice) {
        BigDecimal sellQuantity = request.quantity();

        // 체결 전 주문 원장을 먼저 생성
        Order order = orderRepository.save(
                Order.createMarketSellOrder(wallet, request.symbol(), sellQuantity)
        );

        // 내가 진짜로 그만큼 코인을 가지고 있는지 확인
        Holding holding = holdingRepository.findByAssetsAndSymbol(wallet, request.symbol())
                .orElseThrow(() -> new IllegalArgumentException("해당 코인을 보유하고 있지 않습니다."));

        if (holding.getQuantity().compareTo(sellQuantity) < 0) {
            throw new IllegalArgumentException("보유 수량이 부족합니다.");
        }

        // 매도 체결 원금은 수수료 차감 전 기준
        BigDecimal executedAmount = sellQuantity.multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);

        // 수수료 계산 및 실수령액 산출
        BigDecimal fee = TradeFeePolicy.calculateFee(executedAmount, TradeFeePolicy.MARKET_FEE_RATE);
        BigDecimal settlementAmount = executedAmount.subtract(fee); // 실제 수령액

        // 실현 수익 계산하기 (수수료 반영)
        // 내가 구매한 원금(판 수량 * 내 평단가)
        BigDecimal originalCost = sellQuantity.multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
        BigDecimal realizedProfit = settlementAmount.subtract(originalCost);

        // 지갑에는 수수료를 반영한 실제 정산 금액만 입금된다.
        wallet.addMoney(settlementAmount);

        // 코인 수량 깎기 (만약 다 팔았다면 평단가는 유지하거나, 0으로 만들거나 비즈니스 정책에 따름)
        BigDecimal remainQuantity = holding.getQuantity().subtract(sellQuantity);
        holding.updateHolding(remainQuantity, holding.getAverageBuyPrice());

        // 영수증은 체결된 주문과 함께 기록
        TradeHistory history = TradeHistory.createMarketSellHistory(
                wallet, order, request.symbol(), currentPrice, sellQuantity, executedAmount, fee, realizedProfit
        );
        tradeHistoryRepository.save(history);

        // 시장가 주문은 생성 즉시 전량 체결로 상태를 마감
        order.completeOrder(
                sellQuantity,
                currentPrice,
                executedAmount,
                fee,
                history.getExecutedAt()
        );
        // 시장가 체결 완료 후 알림 생성 및 실시간 전송 로직
        notificationService.notifyOrderCompleted(wallet.getMember(), wallet.getType(), order);

        log.info("[매도 완료] 유저: {}, 코인: {}, 수량: {}, 체결원금: {}, 수수료: {}, 실수령액: {}",
                wallet.getMember().getId(), request.symbol(), sellQuantity, executedAmount, fee, settlementAmount);
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

        // QueryDSL 레포지토리 호출 (요청 사이즈 + 1 개를 가져옴)
        List<TradeHistoryQueryDto> histories = tradeHistoryRepository.searchTradeHistories(memberId, cond, assetId);

        // hasNext(다음 페이지 존재 여부) 파악
        int limitSize = cond.getOrDefaultSize();
        boolean hasNext = histories.size() > limitSize;

        // // 3. 만약 다음 페이지가 있다면, 몰래 1개 더 가져왔던 마지막 녀석은 리스트에서 빼버림 (프론트엔드엔 안 줌)
        if (hasNext) {
            histories.remove(limitSize);
        }

        // 다음 페이지 조회를 위한 '커서 ID(마지막 영수증 번호)' 구하기
        Long nextCursorId = null;
        if (!histories.isEmpty()) {
            nextCursorId = histories.get(histories.size() - 1).tradeId();
        }

        // Query DTO -> 응답 DTO 변환
        List<TradeHistoryResponseDto> content = histories.stream()
                .map(TradeHistoryResponseDto::from)
                .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }
}
