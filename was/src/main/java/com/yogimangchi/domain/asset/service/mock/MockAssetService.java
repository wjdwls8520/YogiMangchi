package com.yogimangchi.domain.asset.service.mock;

import com.yogimangchi.domain.asset.dto.response.HoldingResponseDto;
import com.yogimangchi.domain.asset.dto.response.PortfolioResponseDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.asset.service.PortfolioCalculationService;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockAssetService {

    private final AssetRepository assetRepository;
    private final MemberRepository memberRepository;
    private final HoldingRepository holdingRepository;
    private final PortfolioCalculationService portfolioCalculationService;

    @Transactional
    public void participateMock(Long memberId) {
        Member member = memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 이미 진행 중인 MOCK 지갑이 있는지 확인
        Optional<Assets> activeWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE");
        if (activeWallet.isPresent()) {
            throw new IllegalArgumentException("이미 진행 중인 모의투자가 있습니다. 새롭게 시작하려면 포기(재도전)를 눌러주세요.");
        }

        // 라운드(기존 retryCount) 계산 로직: 모의투자는 무한 재도전 가능
        int currentRound = 1;
        Optional<Assets> lastWallet = assetRepository.findTopByMemberIdAndTypeOrderByRetryCountDesc(memberId, AssetType.MOCK);
        
        if (lastWallet.isPresent()) {
            currentRound = lastWallet.get().getRetryCount() + 1; // 이전 회차 + 1
        }

        // 모의투자 지갑의 만료일 계산 (임시: 이번달 말일)
        LocalDateTime expiredAt = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);

        // 초기 자금 10만 요기달러
        BigDecimal initialMoney = new BigDecimal("100000");

        Assets newWallet = Assets.createNewWallet(member, AssetType.MOCK, initialMoney, currentRound, expiredAt);
        assetRepository.save(newWallet);
        log.info("[모의투자 시작] memberId={}, round={}, walletId={}", memberId, currentRound, newWallet.getId());
    }

    @Transactional
    public void giveUpMock(Long memberId) {
        // 활성화된 MOCK 지갑 찾기
        Assets activeWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("현재 진행 중인 모의투자 지갑이 없습니다."));

        // 남아있는 보유 코인 모두 삭제 처리 (모의투자는 과거 이력을 남기지 않음)
        List<Holding> holdings = holdingRepository.findAllByAssets(activeWallet);
        holdingRepository.deleteAll(holdings);

        // 스냅샷 생략 (기획: 모의투자는 재도전 마다 기록 부여주지 않음)
        // 지갑 상태를 만료(EXPIRED)로 변경
        activeWallet.expireWallet();
        
        log.info("[모의투자 포기] memberId={}, walletId={}", memberId, activeWallet.getId());
    }

    @Transactional(readOnly = true)
    public PortfolioResponseDto getMyMockPortfolio(Long memberId) {
        // 사용자 확인
        memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 활성화 지갑 조회
        Assets myWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 모의투자 지갑을 찾을 수 없습니다. 참가하기를 먼저 진행해주세요."));

        List<Holding> myHoldings = holdingRepository.findAllByAssets(myWallet);

        // 포트폴리오 로직 불러오기
        return portfolioCalculationService.calculatePortfolio(
               AssetType.MOCK.name(), 
               List.of(myWallet), 
               myHoldings
        );
    }
}
