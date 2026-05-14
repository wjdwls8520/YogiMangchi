package com.yogimangchi.domain.asset.service;

import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.dto.response.RealAssetUnifiedResponseDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.futures.entity.FuturesPosition;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.futures.repository.FuturesPositionRepository;
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
public class RealAssetService {

    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final FuturesPositionRepository futuresPositionRepository;
    private final PortfolioCalculationService portfolioCalculationService;
    private final MemberReader memberReader;

    // ------------------------------------------------------------------------
    // [본투자 현물 단독 조회 메서드]
    // 현물 자산 탭이나 특정 기능에서 현물 정보만 따로 필요할 때 사용하는 메서드입니다.
    // 현재는 통합 조회가 기본이므로 서브 기능(현물 전용 화면 등)에서 활용됩니다.
    // ------------------------------------------------------------------------
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public AssetPortfolioDetailResponseDto getMySpotPortfolio(Long memberId) {
        // 1. 요청한 사용자가 유효한지 확인합니다.
        memberReader.getFindMember(memberId);

        // 2. 해당 회원의 '본투자 현물(TRADE_SPOT)' 지갑 중 활성화(ACTIVE)된 지갑을 찾습니다.
        Assets myWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.TRADE_SPOT, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("본투자(현물) 지갑이 비활성화 상태입니다. 인증 및 모의투자 3회를 완료하여 활성화해주세요."));

        // 3. 지갑에 들어있는 현물 코인 보유 목록을 전부 가져옵니다.
        List<Holding> myHoldings = holdingRepository.findAllByAssets(myWallet);

        // 4. 공용 계산기(PortfolioCalculationService)에 현물 지갑과 종목을 던져서 계산 결과를 반환합니다.
        return portfolioCalculationService.calculatePortfolio(
               AssetType.TRADE_SPOT.name(), 
               List.of(myWallet), 
               myHoldings
        );
    }

    // ------------------------------------------------------------------------
    // [본투자 현물+선물 통합 자산 조회 메서드] 🌟 (핵심 로직)
    // 본투자 자산 탭 진입 시 프론트엔드가 실시간 렌더링을 시작하기 위한 기준점(Snapshot) 데이터를 생성합니다.
    // 네트워크 호출을 최소화하기 위해 한 번의 API로 현물, 선물, 총자산을 모두 계산해 내보냅니다.
    // ------------------------------------------------------------------------
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public RealAssetUnifiedResponseDto getUnifiedRealAssetPortfolio(Long memberId) {
        // 1. 사용자 존재 여부 확인
        memberReader.getFindMember(memberId);

        // 2. 본투자 현물 및 선물 지갑 동시 조회
        // ACTIVE 상태인 지갑만 가져오며, 하나라도 없으면 아직 퀘스트(인증/모의투자 3회)를 깨지 않은 것으로 간주하여 차단합니다.
        Assets spotWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.TRADE_SPOT, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("본투자 지갑이 비활성화 상태입니다. 인증 및 모의투자 3회를 완료하여 활성화해주세요."));
                
        Assets futuresWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.TRADE_FUTURE, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("본투자 지갑이 비활성화 상태입니다. 인증 및 모의투자 3회를 완료하여 활성화해주세요."));

        // 3. 각 지갑의 보유 종목 조회
        // 현물은 내가 들고 있는 코인 목록(Holding)을 가져옵니다.
        List<Holding> spotHoldings = holdingRepository.findAllByAssets(spotWallet);
        // 선물은 현재 유지 중인 롱/숏 포지션 목록(PositionStatus.OPEN)만 가져옵니다.
        List<FuturesPosition> openPositions = futuresPositionRepository.findAllByAssetsAndPositionStatus(futuresWallet, PositionStatus.OPEN);

        // 4. 통합 계산기에 재료(현물 지갑+종목, 선물 지갑+포지션)를 모두 넘겨줍니다.
        // 계산기 내부에서 시세를 딱 한 번만 조회하여 가격 불일치(Stale Price) 현상을 원천 차단합니다.
        return portfolioCalculationService.calculateUnifiedPortfolio(spotWallet, spotHoldings, futuresWallet, openPositions);
    }
}