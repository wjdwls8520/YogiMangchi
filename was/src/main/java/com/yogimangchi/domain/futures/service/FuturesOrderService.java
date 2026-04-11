package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.futures.dto.request.FuturesMarketOrderRequestDto;
import com.yogimangchi.domain.futures.repository.FuturesOrderRepository;
import com.yogimangchi.global.exception.asset.AssetException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class FuturesOrderService {

    private final AssetRepository assetRepository;

    private final FuturesOrderRepository futuresOrderRepository;

    // 선물 주문 로직 ( 본 투자 선물주문과 대회 선물주문이 분기되어 있음 )
    @Transactional
    public void placeFuturesMarketOrder(Long memberId, Long contestSeasonId, FuturesMarketOrderRequestDto request) {
        Assets wallet;

        if (contestSeasonId == null) {
            wallet = findRealFuturesWallet(memberId);
        } else {
            wallet = findContestFuturesWallet(memberId, contestSeasonId);
        }

        // TODO: 조회한 지갑 기준으로 공통 선물 시장가 주문 로직을 이어서 구현한다.
    }

    // 본투자 선물은 활성화된 개인 선물 지갑만 조회한다.
    private Assets findRealFuturesWallet(Long memberId) {
        return assetRepository.findByMember_IdAndTypeAndStatusForUpdate(
                        memberId,
                        AssetType.TRADE_FUTURE,
                        "ACTIVE"
                )
                .orElseThrow(AssetException::tradableRealFuturesWalletNotFound);
    }

    // 대회 선물은 시즌 ID와 현재 거래 가능 상태까지 함께 검증한 지갑만 허용한다.
    private Assets findContestFuturesWallet(Long memberId, Long contestSeasonId) {
        return assetRepository.findTradableContestWalletForUpdate(
                        memberId,
                        AssetType.CONTEST,
                        "ACTIVE",
                        contestSeasonId,
                        LocalDateTime.now()
                )
                .orElseThrow(AssetException::tradableContestFuturesWalletNotFound);
    }
}
