package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.futures.dto.request.FuturesMarketOrderRequestDto;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.domain.futures.support.FuturesWalletReader;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class FuturesOrderService {

    private final MemberReader memberReader;
    private final FuturesWalletReader futuresWalletReader;

    private final FuturesOrderRepository futuresOrderRepository;

    // 선물 주문 로직 ( 본 투자 선물주문과 대회 선물주문이 분기되어 있음 )
    @Transactional
    public void placeFuturesMarketOrder(Long memberId, Long contestSeasonId, FuturesMarketOrderRequestDto request) {
        Assets wallet;

        if (contestSeasonId == null) {
            // 본 투자 선물 주문 로직
            wallet = futuresWalletReader.getTradableRealWallet(memberId);

           // FuturesOrder.create(wallet, request.symbol(), request.positionSide(), request.positionAction(), request.orderQuantity());
        } else {
            // 대회 선물 주문 로직
            wallet = futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);
        }



    }

    // TODO: 조회한 지갑 기준으로 공통 선물 시장가 주문 로직을 이어서 구현한다.
}
