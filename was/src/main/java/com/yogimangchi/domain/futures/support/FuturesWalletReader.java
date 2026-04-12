package com.yogimangchi.domain.futures.support;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.global.exception.asset.AssetException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class FuturesWalletReader {

    private final AssetRepository assetRepository;

    // 본투자 선물은 활성화된 개인 선물 지갑만 조회한다.
    public Assets getTradableRealWallet(Long memberId) {
        return assetRepository.findByMember_IdAndTypeAndStatusForUpdate(
                        memberId,
                        AssetType.TRADE_FUTURE,
                        "ACTIVE"
                )
                .orElseThrow(AssetException::tradableRealFuturesWalletNotFound);
    }

    // 대회 선물은 시즌 ID와 현재 거래 가능 상태까지 함께 검증한 지갑만 허용한다.
    public Assets getTradableContestWallet(Long memberId, Long contestSeasonId) {
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
