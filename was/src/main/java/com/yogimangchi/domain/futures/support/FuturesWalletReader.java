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

    // 정산 완료/종료된 대회 지갑 사후 조회 — 락 없음, 상태/시각 필터 없음
    //
    // 활성 지갑(getReadableContestWallet) 과 분리한 이유
    //   - 활성 가드(ACTIVE + contestEndAt >= now) 가 너무 엄격해 정산 완료된 시즌은 조회 불가
    //   - 사용자가 정산 후 본인 시즌 결과/지갑 상태를 사후 조회할 수 있어야 함
    //   - 신규 호출자가 의도치 않게 비활성 지갑을 잡지 않도록 명시적으로 분리
    //
    // 인가 — (member, season) 매칭으로 본인 데이터만 자연 노출. 비참가자는 not found.
    public Assets getFinishedContestWallet(Long memberId, Long contestSeasonId) {
        return assetRepository.findContestWalletByMemberAndSeason(
                        memberId,
                        AssetType.CONTEST,
                        contestSeasonId
                )
                .orElseThrow(AssetException::tradableContestFuturesWalletNotFound);
    }
}
