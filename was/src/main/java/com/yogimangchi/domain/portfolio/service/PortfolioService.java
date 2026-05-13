package com.yogimangchi.domain.portfolio.service;

import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.asset.service.PortfolioCalculationService;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.portfolio.dto.response.ProfilePortfolioResponseDto;
import com.yogimangchi.global.exception.member.MemberException;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private static final String ACTIVE_STATUS = "ACTIVE";

    private final MemberRepository memberRepository;
    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final PortfolioCalculationService portfolioCalculationService;

    /**
     * 내 프로필 화면에서 사용하는 포트폴리오 조회 진입점이다.
     * 인증된 사용자인지 확인한 뒤 활성 지갑 기준으로 프로필 응답을 만든다.
     * 회원은 존재하지만 아직 지갑이 없으면 예외 대신 empty 를 반환해 컨트롤러가 204 로 응답하게 한다.
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Optional<ProfilePortfolioResponseDto> getMyProfilePortfolio(Long loginMemberId, AssetType assetType) {
        memberRepository.findActiveById(loginMemberId)
                .orElseThrow(MemberException::memberNotFound);
        return getProfilePortfolioByAssetType(loginMemberId, assetType);
    }

    /**
     * 다른 회원 프로필 화면에서 사용하는 포트폴리오 조회 진입점이다.
     * 대상 회원이 없거나 탈퇴한 경우는 404, 회원은 있지만 지갑이 없으면 204 의미로 분리한다.
     */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Optional<ProfilePortfolioResponseDto> getMemberProfilePortfolio(Long memberId, AssetType assetType) {
        memberRepository.findActiveById(memberId)
                .orElseThrow(MemberException::memberNotFound);
        return getProfilePortfolioByAssetType(memberId, assetType);
    }

    /**
     * 특정 타입의 활성 지갑과 보유 종목을 읽어 프로필용 DTO 로 변환한다.
     * 계산 자체는 자산 상세 계산 로직을 재사용하고, 프로필에 필요한 필드만 다시 담아 반환한다.
     */
    private Optional<ProfilePortfolioResponseDto> getProfilePortfolioByAssetType(Long memberId, AssetType assetType) {
        Optional<Assets> activeWalletOpt = assetRepository.findByMemberIdAndTypeAndStatus(memberId, assetType, ACTIVE_STATUS);
        if (activeWalletOpt.isEmpty()) {
            return Optional.empty();
        }

        Assets activeWallet = activeWalletOpt.get();

        List<Holding> holdings = holdingRepository.findAllByAssets(activeWallet);
        AssetPortfolioDetailResponseDto portfolio = portfolioCalculationService.calculatePortfolio(
                assetType.name(),
                List.of(activeWallet),
                holdings
        );

        return Optional.of(new ProfilePortfolioResponseDto(
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
        ));
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