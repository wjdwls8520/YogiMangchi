package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.asset.service.PortfolioCalculationService;
import com.yogimangchi.domain.member.dto.response.ProfilePortfolioResponseDto;
import com.yogimangchi.global.support.MemberReader;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberPortfolioService {

    private static final String ACTIVE_STATUS = "ACTIVE";

    private final MemberReader memberReader;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final PortfolioCalculationService portfolioCalculationService;

    /**
     * 내 프로필 화면에서 사용하는 포트폴리오 조회 진입점이다.
     * 인증된 사용자인지 확인한 뒤 활성 MOCK 지갑 기준으로 프로필 응답을 만든다.
     */
    @Transactional(readOnly = true)
    public ProfilePortfolioResponseDto getMyProfilePortfolio(Long loginMemberId) {
        memberReader.getAuthenticated(loginMemberId);
        return getMockProfilePortfolio(loginMemberId);
    }

    /**
     * 다른 회원 프로필 화면에서 사용하는 포트폴리오 조회 진입점이다.
     * 대상 회원 존재 여부를 확인한 뒤 동일한 프로필 포트폴리오 규격으로 응답한다.
     */
    @Transactional(readOnly = true)
    public ProfilePortfolioResponseDto getMemberProfilePortfolio(Long memberId) {
        memberReader.getFindMember(memberId);
        return getMockProfilePortfolio(memberId);
    }

    /**
     * 활성 MOCK 지갑과 보유 종목을 읽어 프로필용 DTO 로 변환한다.
     * 계산 자체는 자산 상세 계산 로직을 재사용하고, 프로필에 필요한 필드만 다시 담아 반환한다.
     */
    private ProfilePortfolioResponseDto getMockProfilePortfolio(Long memberId) {
        Assets activeWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, ACTIVE_STATUS)
                .orElseThrow(() -> new IllegalArgumentException("활성화된 모의투자 지갑을 찾을 수 없습니다."));

        List<Holding> holdings = holdingRepository.findAllByAssets(activeWallet);
        AssetPortfolioDetailResponseDto portfolio = portfolioCalculationService.calculatePortfolio(
                AssetType.MOCK.name(),
                List.of(activeWallet),
                holdings
        );

        return new ProfilePortfolioResponseDto(
                portfolio.assetType(),
                portfolio.holdingCount(),
                portfolio.seedMoney(),
                portfolio.cashBalance(),
                portfolio.totalBuyAmount(),
                portfolio.totalCoinValue(),
                portfolio.totalAsset(),
                portfolio.totalProfit(),
                portfolio.totalRoi(),
                resolveUpdatedAt(activeWallet, holdings),
                portfolio.holdings()
        );
    }

    /**
     * 지갑과 보유 종목 중 가장 최근에 변경된 시각을 프로필용 updatedAt 으로 사용한다.
     * 실시간 시세 반영 시각이 아니라 포트폴리오 구성 자체가 마지막으로 바뀐 시점을 뜻한다.
     */
    private LocalDateTime resolveUpdatedAt(Assets wallet, List<Holding> holdings) {
        return Stream.concat(Stream.of(wallet.getUpdatedAt()), holdings.stream().map(Holding::getUpdatedAt))
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .orElse(wallet.getUpdatedAt());
    }
}
