package com.yogimangchi.domain.asset.service;

import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AssetSpotService {

    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final PortfolioCalculationService portfolioCalculationService;
    private final MemberReader memberReader;

    /**
     * 본투자 현물(TRADE_SPOT) 지갑의 자산 상세 정보를 조회한다.
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public AssetPortfolioDetailResponseDto getMySpotPortfolio(Long memberId) {
        // 사용자 확인
        memberReader.getFindMember(memberId);

        // 활성화된 본투자 현물 지갑 조회
        Assets myWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.TRADE_SPOT, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("본투자(현물) 지갑이 비활성화 상태입니다. 인증 및 모의투자 3회를 완료하여 활성화해주세요."));

        List<Holding> myHoldings = holdingRepository.findAllByAssets(myWallet);

        // 자산 상세 응답 계산은 공용 계산 서비스에 위임한다.
        return portfolioCalculationService.calculatePortfolio(
               AssetType.TRADE_SPOT.name(), 
               List.of(myWallet), 
               myHoldings
        );
    }
}