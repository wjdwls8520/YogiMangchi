package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
import com.yogimangchi.domain.futures.dto.request.FuturesMarketOrderOpenRequestDto;
import com.yogimangchi.domain.futures.entity.FuturesOrder;
import com.yogimangchi.domain.futures.enums.OrderStatus;
import com.yogimangchi.domain.futures.enums.OrderType;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.support.FuturesWalletReader;
import com.yogimangchi.domain.market.repository.FuturesSymbolPolicyRepository;
import com.yogimangchi.global.support.MemberReader;
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

    // 선물 주문 로직 ( 본 투자 선물주문과 대회 선물주문이 분기되어 있음 )
    @Transactional
    public void placeFuturesMarketOrderOpen(Long memberId, Long contestSeasonId, FuturesMarketOrderOpenRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();

        // ** 주문생성에 필요한 값들 **
        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getTradableRealWallet(memberId)
                : futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);
        // 선물지갑에 유저가 특정 심볼의 적용했던 레버리지 값을 가져옴 and 거래가능한 심볼인지 검증.
        int leverage = futuresLeverageService.getLeverage(memberId, contestSeasonId, symbol).leverage();
        OrderType orderType = OrderType.MARKET;
        OrderStatus orderStatus = OrderStatus.COMPLETED;
        // 현재 시세 조회
        ChartPriceDto currentPrice = chartPriceRepository.findBySymbol(symbol).orElseThrow(() -> new IllegalArgumentException("현재 해당 코인의 시세를 확인할 수 없습니다."));
        // 주문 시장가
        BigDecimal orderPrice = new BigDecimal(currentPrice.price());
        // 주문 증거금
        BigDecimal orderMargin = orderPrice.multiply(request.orderQuantity()).divide(new BigDecimal(leverage), 8, RoundingMode.HALF_UP);
        // 주문 명목금액
        BigDecimal notionalAmount = orderPrice.multiply(request.orderQuantity());
        // 시장가 수수료 0.05

        BigDecimal totalFee = notionalAmount.multiply(MARKET_TRADE_FEE);
        // ****    ****

        // 최소 주문 금액 검증
        if(notionalAmount.compareTo(MIN_ORDER_AMOUNT) < 0) {
            throw new IllegalArgumentException("최소 주문 금액이 '10YD' 보다 낮습니다.");
        }

        // 필요 주문 금액 검증
        BigDecimal totalRequired = orderMargin.add(totalFee);
        if (wallet.getCurrentMoney().compareTo(totalRequired) < 0) {
            throw new IllegalArgumentException("주문에 필요한 금액이 지갑 잔고금액보다 큽니다.");
        }

        // 잔고 차감
        wallet.subtractMoney(orderMargin.add(totalFee));

        // 주문서 생성
        FuturesOrder futuresOrder = FuturesOrder.orderMarketCreate(
            wallet,
            symbol,
            orderType,
            orderStatus,
            request.positionSide(),
            PositionStatus.OPEN,

            orderPrice,
            request.orderQuantity(),
            request.orderQuantity(), // (체결된 개수) 요기망치 프로젝트는 기본적으로 차트로직을 바이낸스에서 받기 때문에 호가가없어 즉시 구매로 적용
            BigDecimal.ZERO, // (남은 물량) 즉시 체결
            orderPrice, // (평균 체결가격) 즉시체결

            orderMargin,
            notionalAmount,
            notionalAmount, // (체결된 명목금액) 즉시체결
            totalFee, // (체결된 명목금액의 수수료) 즉시체결

            LocalDateTime.now() // (주문의 모든체결이 완료된 시점) 즉시체결
        );
        futuresOrderRepository.save(futuresOrder);

        // 시장가 즉시 체결로 인해 포지션 생성 혹은 추가 진입
        futuresPositionService.openPosition(wallet, symbol, request.positionSide(), request.orderQuantity(), orderPrice, leverage, orderMargin, notionalAmount);

    }

    // TODO: 조회한 지갑 기준으로 공통 선물 시장가 주문 로직을 이어서 구현한다.
}
