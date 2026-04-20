package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.futures.dto.query.FuturesPositionOpenResult;
import com.yogimangchi.domain.futures.dto.request.FuturesMarketOrderCloseRequestDto;
import com.yogimangchi.domain.futures.dto.request.FuturesMarketOrderOpenRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesMarketOrderResponseDto;
import com.yogimangchi.domain.futures.dto.response.FuturesOrderResultDto;
import com.yogimangchi.domain.futures.dto.response.FuturesPositionResultDto;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.support.FuturesWalletReader;
import com.yogimangchi.domain.market.repository.FuturesSymbolPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class FuturesOrderService {

    private final FuturesWalletReader futuresWalletReader;

    private final ChartPriceRepository chartPriceRepository;
    private final FuturesOrderRepository futuresOrderRepository;
    private final FuturesSymbolPolicyRepository futuresSymbolPolicyRepository;

    private final FuturesLeverageService futuresLeverageService;
    private final FuturesPositionService futuresPositionService;

    // 시장가, 지정가 수수료
    private final static BigDecimal MARKET_TRADE_FEE = new BigDecimal("0.0005");
    private final static BigDecimal LIMIT_TRADE_FEE = new BigDecimal("0.0003");

    private final static BigDecimal MIN_ORDER_AMOUNT = new BigDecimal("10");

    // 선물 시장가 진입 주문
    @Transactional
    public FuturesMarketOrderResponseDto placeFuturesMarketOrderOpen(Long memberId, Long contestSeasonId, FuturesMarketOrderOpenRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();

        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getTradableRealWallet(memberId)
                : futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);

        // 심볼 검증 + 적용 레버리지 조회
        int leverage = futuresLeverageService.getLeverage(memberId, contestSeasonId, symbol).leverage();

        // 현재 시세 조회
        ChartPriceDto currentPrice = chartPriceRepository.findBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("현재 해당 코인의 시세를 확인할 수 없습니다."));
        BigDecimal orderPrice = new BigDecimal(currentPrice.price());

        // 증거금 / 명목금액 / 수수료 계산
        BigDecimal orderMargin = orderPrice.multiply(request.orderQuantity()).divide(new BigDecimal(leverage), 8, RoundingMode.HALF_UP);
        BigDecimal notionalAmount = orderPrice.multiply(request.orderQuantity());
        BigDecimal totalFee = notionalAmount.multiply(MARKET_TRADE_FEE);

        // 최소 주문 금액 검증
        if (notionalAmount.compareTo(MIN_ORDER_AMOUNT) < 0) {
            throw new IllegalArgumentException("최소 주문 금액이 '10YD' 보다 낮습니다.");
        }

        // 잔고 검증 및 차감
        BigDecimal totalRequired = orderMargin.add(totalFee);
        if (wallet.getCurrentMoney().compareTo(totalRequired) < 0) {
            throw new IllegalArgumentException("주문에 필요한 금액이 지갑 잔고금액보다 큽니다.");
        }
        wallet.subtractMoney(totalRequired);

        // 주문 히스토리 저장
        FuturesOrder futuresOrder = FuturesOrder.orderMarketCreate(
                wallet, symbol, OrderType.MARKET, OrderStatus.COMPLETED,
                request.positionSide(), PositionStatus.OPEN,
                orderPrice, request.orderQuantity(), request.orderQuantity(),
                BigDecimal.ZERO, orderPrice,
                orderMargin, notionalAmount, notionalAmount, totalFee,
                LocalDateTime.now()
        );
        futuresOrderRepository.save(futuresOrder);

        // 포지션 생성 또는 추가 진입 — isNewPosition으로 신규/추가 구분
        FuturesPositionOpenResult positionResult = futuresPositionService.openPosition(
                wallet, symbol, request.positionSide(), request.orderQuantity(),
                orderPrice, leverage, orderMargin, notionalAmount
        );

        return new FuturesMarketOrderResponseDto(
                FuturesOrderResultDto.from(futuresOrder),
                FuturesPositionResultDto.fromOpen(positionResult.position(), positionResult.isNewPosition())
        );
    }

    // 선물 시장가 청산 주문
    @Transactional
    public FuturesMarketOrderResponseDto placeFuturesMarketOrderClose(Long memberId, Long contestSeasonId, FuturesMarketOrderCloseRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();

        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getTradableRealWallet(memberId)
                : futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);

        // 현재 시세 조회
        ChartPriceDto currentPrice = chartPriceRepository.findBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("현재 해당 코인의 시세를 확인할 수 없습니다."));
        BigDecimal closePrice = new BigDecimal(currentPrice.price());

        // 청산 명목금액 및 수수료 계산
        BigDecimal closeNotional = closePrice.multiply(request.closeQuantity());
        BigDecimal totalFee = closeNotional.multiply(MARKET_TRADE_FEE);

        // 주문 히스토리 저장 (orderMargin은 포지션 비율로 산출되므로 0 기록)
        FuturesOrder futuresOrder = FuturesOrder.orderMarketCreate(
                wallet, symbol, OrderType.MARKET, OrderStatus.COMPLETED,
                request.positionSide(), PositionStatus.CLOSE,
                closePrice, request.closeQuantity(), request.closeQuantity(),
                BigDecimal.ZERO, closePrice,
                BigDecimal.ZERO, closeNotional, closeNotional, totalFee,
                LocalDateTime.now()
        );
        futuresOrderRepository.save(futuresOrder);

        // 포지션 청산 — 증거금 반환 + 실현손익 정산 + 포지션 수치 차감
        FuturesPosition closedPosition = futuresPositionService.closePosition(
                wallet, symbol, request.positionSide(), request.closeQuantity(), closePrice
        );

        // 이번 청산의 실현손익 계산 (entryPrice는 청산 후에도 불변)
        BigDecimal thisCloseRealizedPnl;
        if (request.positionSide() == PositionSide.LONG) {
            thisCloseRealizedPnl = closePrice.subtract(closedPosition.getEntryPrice())
                    .multiply(request.closeQuantity())
                    .setScale(8, RoundingMode.HALF_UP);
        } else {
            thisCloseRealizedPnl = closedPosition.getEntryPrice().subtract(closePrice)
                    .multiply(request.closeQuantity())
                    .setScale(8, RoundingMode.HALF_UP);
        }

        return new FuturesMarketOrderResponseDto(
                FuturesOrderResultDto.from(futuresOrder),
                FuturesPositionResultDto.fromClose(closedPosition, thisCloseRealizedPnl)
        );
    }
}
