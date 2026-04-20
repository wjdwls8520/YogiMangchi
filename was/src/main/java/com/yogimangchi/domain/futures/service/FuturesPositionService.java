package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FuturesPositionService {

    private final FuturesPositionRepository futuresPositionRepository;

    /**
     * OPEN 주문 체결 시 호출
     * 1. 동일 지갑 + 동일 심볼 + 동일 방향(LONG/SHORT) + OPEN 상태의 포지션이 있는지 조회
     * 2. 포지션이 없으면 → FuturesPosition.open() 으로 신규 포지션 생성 후 저장
     * 3. 포지션이 있으면 → 기존 포지션에 추가 진입 (물타기)
     *    - 새로운 평균 진입가 계산:
     *      newEntryPrice = (기존수량 * 기존진입가 + 추가수량 * 추가진입가) / (기존수량 + 추가수량)
     *    - 총 증거금 합산: totalMargin += 추가 증거금
     *    - 명목금액 합산: notionalAmount += 추가 명목금액
     *    - 수량 합산: filledQuantity += 추가 수량
     *    - 레버리지 충돌 검증: 기존 포지션 레버리지 != 추가 진입 레버리지면 예외
     */

    /**
     * OPEN 주문 체결 시 호출 — FuturesOrderService 에서만 호출할 것
     * 지갑 잔고 검증, 심볼 검증은 FuturesOrderService 에서 완료된 상태로 호출됨
     * 독립적으로 호출 시 검증 없이 포지션만 생성되므로 주의
     */
    @Transactional
    public void openPosition(
            Assets wallet,      // 벨리데이션 체크가 완료된 월렛
            String symbol,
            PositionSide positionSide,
            BigDecimal quantity,
            BigDecimal entryPrice,
            int leverage,
            BigDecimal totalMargin,
            BigDecimal notionalAmount
    ) {
        Optional<FuturesPosition> isPosition = futuresPositionRepository.findByAssetsAndSymbolAndPositionSideWherePositionStatusForUpdate(wallet, symbol, positionSide, PositionStatus.OPEN);

        // ifPresentOrElse()는 있을 때/없을 때 두 케이스를 한 번에 표현합니다.
        isPosition.ifPresentOrElse(
            // 있으면 추가 진입
            position -> position.addEntry(quantity, entryPrice, totalMargin, notionalAmount),
            // 없으면 신규 생성
            () -> futuresPositionRepository.save(
                    FuturesPosition.open(wallet, symbol, positionSide, quantity, entryPrice, leverage, totalMargin, notionalAmount )
            )
        );


    }

    /**
     * CLOSE 주문 체결 시 호출
     * 1. 동일 지갑 + 동일 심볼 + 동일 방향 + OPEN 상태의 포지션 조회
     *    - 포지션이 없으면 예외 처리 ("청산할 포지션이 없습니다")
     * 2. 청산 수량이 보유 수량보다 크면 예외 처리 ("보유 수량이 부족합니다")
     * 3. 실현 손익 계산:
     *    - LONG  실현손익 = (청산가 - 평균진입가) * 청산수량 * 레버리지
     *    - SHORT 실현손익 = (평균진입가 - 청산가) * 청산수량 * 레버리지
     * 4. 청산에 사용된 증거금 계산:
     *    - 청산증거금 = totalMargin * (청산수량 / 전체수량)
     * 5. 지갑에 정산: wallet.addMoney(청산증거금 + 실현손익)
     * 6. 포지션 수량 차감
     *    - 잔여수량이 0 이면 → 포지션 상태를 CLOSED 로 변경
     *    - 잔여수량이 남아있으면 → totalMargin, notionalAmount 차감 후 유지
     */
    @Transactional
    public void closePosition(
            Assets wallet,
            String symbol,
            PositionSide positionSide,
            BigDecimal closeQuantity,
            BigDecimal closePrice
    ) {
        // 여기에 작성
    }
}