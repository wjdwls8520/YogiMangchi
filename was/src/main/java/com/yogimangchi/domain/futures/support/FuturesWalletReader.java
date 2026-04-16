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

    // ── 쓰기용 (FOR UPDATE) ────────────────────────────────────────────────

    // 본투자 쓰기 — 비관적 락
    public Assets getTradableRealWallet(Long memberId) {
        return assetRepository.findByMember_IdAndTypeAndStatusForUpdate(
                        memberId,
                        AssetType.TRADE_FUTURE,
                        "ACTIVE"
                )
                .orElseThrow(AssetException::tradableRealFuturesWalletNotFound);
    }

    // 대회 쓰기 — 비관적 락, 시즌 진행 중 검증 포함
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

    // ── 읽기용 (락 없음) ───────────────────────────────────────────────────

    // 본투자 읽기 — 락 없음
    public Assets getReadableRealWallet(Long memberId) {
        return assetRepository.findByMemberIdAndTypeAndStatus(
                        memberId,
                        AssetType.TRADE_FUTURE,
                        "ACTIVE"
                )
                .orElseThrow(AssetException::tradableRealFuturesWalletNotFound);
    }

    // 대회 읽기 — 락 없음, 시즌 진행 중 검증 포함
    public Assets getReadableContestWallet(Long memberId, Long contestSeasonId) {
        return assetRepository.findTradableContestWallet(
                        memberId,
                        AssetType.CONTEST,
                        "ACTIVE",
                        contestSeasonId,
                        LocalDateTime.now()
                )
                .orElseThrow(AssetException::tradableContestFuturesWalletNotFound);
    }
}
