package com.yogimangchi.domain.asset.service.mock;

import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.dto.response.MockAssetStatusResponseDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.entity.Holding;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.asset.repository.HoldingRepository;
import com.yogimangchi.domain.asset.service.PortfolioCalculationService;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.spot.service.SpotOrderService;
import com.yogimangchi.global.support.MemberReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockAssetService {

    private final AssetRepository assetRepository;
    private final HoldingRepository holdingRepository;
    private final PortfolioCalculationService portfolioCalculationService;
    private final MemberReader memberReader;
    private final SpotOrderService spotOrderService;

    /**
     * 로그인 회원에게 새로운 활성 MOCK 지갑을 발급한다.
     * 이미 진행 중인 지갑이 있으면 중복 참여를 막고, 없으면 재도전 횟수를 올려 새 지갑을 만든다.
     * 동시 요청으로 중복 ACTIVE 지갑이 생기지 않도록 DB 유니크 인덱스와 saveAndFlush 로 한 번 더 방어한다.
     */
    @Transactional
    public void participateMock(Long memberId) {
        Member member = memberReader.getFindMember(memberId);

        // 이미 진행 중인 MOCK 지갑이 있는지 확인
        Optional<Assets> activeWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE");
        if (activeWallet.isPresent()) {
            throw new IllegalArgumentException("이미 진행 중인 모의투자가 있습니다. 새롭게 시작하려면 포기(재도전)를 눌러주세요.");
        }

        // 라운드(기존 retryCount) 계산 로직: 모의투자는 무한 재도전 가능
        int currentRetryCount = 0;
        Optional<Assets> lastWallet = assetRepository.findTopByMemberIdAndTypeOrderByRetryCountDesc(memberId, AssetType.MOCK);

        if (lastWallet.isPresent()) {
            currentRetryCount = lastWallet.get().getRetryCount() + 1; // 이전 도전에 + 1
        }

        // 모의투자는 시즌이 없기 때문에 기간을 2099년으로 지정
        LocalDateTime expiredAt = LocalDateTime.of(2099, 12, 31, 23, 59, 59);

        // 초기 자금 1만 요기달러
        BigDecimal initialMoney = new BigDecimal("10000");

        Assets newWallet = Assets.createNewWallet(member, AssetType.MOCK, initialMoney, currentRetryCount, expiredAt);
        try {
            assetRepository.saveAndFlush(newWallet);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("이미 진행 중인 모의투자가 있습니다. 새롭게 시작하려면 포기(재도전)를 눌러주세요.");
        }
        log.info("[모의투자 시작] memberId={}, round={}, walletId={}", memberId, currentRetryCount, newWallet.getId());
    }

    /**
     * 현재 진행 중인 MOCK 지갑을 종료하고 모의투자 상태를 초기화한다.
     * 미체결 주문을 취소한 뒤 보유 종목을 비우고, 지갑 상태를 EXPIRED 로 바꾼다.
     * 주문 생성/체결과 같은 지갑 락 경로를 사용해 포기 중 상태가 다른 쓰기 작업과 엇갈리지 않도록 맞춘다.
     */
    @Transactional
    public void giveUpMock(Long memberId) {
        // 활성화된 MOCK 지갑을 먼저 잠가 포기 로직 전체를 같은 지갑 단위로 직렬화한다.
        Assets activeWallet = assetRepository.findByMemberIdAndTypeAndStatusForUpdate(memberId, AssetType.MOCK, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("현재 진행 중인 모의투자 지갑이 없습니다."));

        spotOrderService.cancelOpenLimitOrdersByAsset(activeWallet);

        // 남아있는 보유 코인 모두 삭제 처리 (모의투자는 과거 이력을 남기지 않음)
        List<Holding> holdings = holdingRepository.findAllByAssets(activeWallet);
        holdingRepository.deleteAll(holdings);

        // 지갑 상태를 만료(EXPIRED)로 변경
        activeWallet.expireWallet();
        
        log.info("[모의투자 포기] memberId={}, walletId={}", memberId, activeWallet.getId());
    }

    /**
     * 로그인 여부와 활성 MOCK 지갑 존재 여부만 빠르게 확인하는 상태 조회 메서드다.
     * 프론트가 참가 버튼/진행 상태를 나누어 그릴 때 사용한다.
     */
    @Transactional(readOnly = true)
    public MockAssetStatusResponseDto getMockAssetStatus(Long memberId) {
        if (memberId == null) {
            return new MockAssetStatusResponseDto(false, false);
        }

        boolean isParticipated = assetRepository
                .findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                .isPresent();

        return new MockAssetStatusResponseDto(true, isParticipated);
    }

    /**
     * 현재 로그인 회원의 활성 MOCK 지갑을 기준으로 자산탭용 상세 포트폴리오를 계산한다.
     * 실제 금액/수익률 계산은 공용 PortfolioCalculationService 에 위임한다.
     */
    @Transactional(readOnly = true)
    public AssetPortfolioDetailResponseDto getMyMockPortfolio(Long memberId) {
        // 사용자 확인
        memberReader.getFindMember(memberId);

        // 활성화 지갑 조회
        Assets myWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, AssetType.MOCK, "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("활성화된 모의투자 지갑을 찾을 수 없습니다. 참가하기를 먼저 진행해주세요."));

        List<Holding> myHoldings = holdingRepository.findAllByAssets(myWallet);

        // 자산 상세 응답 계산은 공용 계산 서비스에 위임한다.
        return portfolioCalculationService.calculatePortfolio(
               AssetType.MOCK.name(), 
               List.of(myWallet), 
               myHoldings
        );
    }
}
