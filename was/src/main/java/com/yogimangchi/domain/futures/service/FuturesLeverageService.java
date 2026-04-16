package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.futures.dto.request.FuturesLeverageRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesLeverageResponseDto;
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

        // 쓰기 트랜잭션 — 비관적 락으로 지갑 조회
        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getTradableRealWallet(memberId)
                : futuresWalletReader.getTradableContestWallet(memberId, contestSeasonId);

        // 본투자 지갑은 만료 여부를 별도 검증 (대회 지갑은 쿼리에서 시즌 기간으로 이미 검증)
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

        // 행이 없으면 INSERT, 있으면 UPDATE — 단일 원자 연산으로 경쟁 조건 방지
        futuresLeverageSettingRepository.upsertLeverage(wallet.getId(), symbol, request.leverage());

        return new FuturesLeverageResponseDto(symbol, request.leverage(), maxLeverage);
    }

    @Transactional(readOnly = true)
    public FuturesLeverageResponseDto getLeverage(Long memberId, Long contestSeasonId, String symbol) {
        String upperSymbol = symbol.trim().toUpperCase();

        // 읽기 트랜잭션 — 락 없이 지갑 조회
        Assets wallet = (contestSeasonId == null)
                ? futuresWalletReader.getReadableRealWallet(memberId)
                : futuresWalletReader.getReadableContestWallet(memberId, contestSeasonId);

        // 선물 지원 심볼 여부 + 레버리지 정책 조회 (maxLeverage 응답에 필요)
        FuturesSymbolPolicy policy = futuresSymbolPolicyRepository.findWithMarketSymbolBySymbol(upperSymbol)
                .orElseThrow(() -> new IllegalArgumentException("선물 거래를 지원하지 않는 심볼입니다: " + upperSymbol));

        int maxLeverage = (wallet.getType() == AssetType.CONTEST)
                ? policy.getContestMaxLeverage()
                : policy.getMaxLeverage();

        // 설정이 없으면 DB에 저장하지 않고 기본값 1 반환
        int leverage = futuresLeverageSettingRepository
                .findByAssetsAndSymbol(wallet, upperSymbol)
                .map(setting -> setting.getLeverage())
                .orElse(1);

        return new FuturesLeverageResponseDto(upperSymbol, leverage, maxLeverage);
    }
}
