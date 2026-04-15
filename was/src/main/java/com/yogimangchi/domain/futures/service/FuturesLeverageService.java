package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.futures.dto.request.FuturesLeverageRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesLeverageResponseDto;
import com.yogimangchi.domain.futures.entity.FuturesLeverageSetting;
import com.yogimangchi.domain.futures.repository.FuturesLeverageSettingRepository;
import com.yogimangchi.domain.futures.support.FuturesWalletReader;
import com.yogimangchi.domain.market.entity.FuturesSymbolPolicy;
import com.yogimangchi.domain.market.repository.FuturesSymbolPolicyRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FuturesLeverageService {

    private final FuturesWalletReader futuresWalletReader;
    private final FuturesSymbolPolicyRepository futuresSymbolPolicyRepository;
    private final FuturesLeverageSettingRepository futuresLeverageSettingRepository;

    @Transactional
    public FuturesLeverageResponseDto setLeverage(Long memberId, Long contestSeasonId, FuturesLeverageRequestDto request) {
        String symbol = request.symbol().trim().toUpperCase();

        // 지갑 조회 (대회/본투자 분기)
        Assets wallet = resolveWallet(memberId, contestSeasonId);

        // 본투자 선물 지갑은 만료 여부를 별도로 검증한다.
        // (대회 지갑은 getTradableContestWallet 쿼리에서 시즌 날짜 범위를 이미 검증함)
        if (wallet.getType() == AssetType.TRADE_FUTURE && LocalDateTime.now().isAfter(wallet.getExpiredAt())) {
            throw new IllegalArgumentException("선물 지갑의 이용 기간이 만료되었습니다. 지갑을 다시 생성해주세요.");
        }

        // 선물 지원 심볼 여부 + 레버리지 정책 조회
        FuturesSymbolPolicy policy = futuresSymbolPolicyRepository.findWithMarketSymbolBySymbol(symbol)
                .orElseThrow(() -> new IllegalArgumentException("선물 거래를 지원하지 않는 심볼입니다: " + symbol));

        // 지갑 타입에 따라 적용할 최대 레버리지 결정
        int maxLeverage = (wallet.getType() == AssetType.CONTEST)
                ? policy.getContestMaxLeverage()
                : policy.getMaxLeverage();

        // 요청 레버리지 범위 검증
        if (request.leverage() > maxLeverage) {
            throw new IllegalArgumentException(
                    symbol + " 심볼의 최대 레버리지는 " + maxLeverage + "배입니다. (요청값: " + request.leverage() + "배)"
            );
        }

        // 설정 조회 또는 신규 생성 후 레버리지 갱신
        FuturesLeverageSetting setting = futuresLeverageSettingRepository
                .findByAssetsAndSymbolForUpdate(wallet, symbol)
                .orElseGet(() -> futuresLeverageSettingRepository.save(
                        FuturesLeverageSetting.createDefault(wallet, symbol)
                ));

        setting.updateLeverage(request.leverage());

        return new FuturesLeverageResponseDto(symbol, setting.getLeverage(), maxLeverage);
    }

    private Assets resolveWallet(Long memberId, Long contestSeasonId) {
        if (contestSeasonId == null) {
            return futuresWalletReader.getTradableRealWallet(memberId);
        }
        return futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);
    }
}
