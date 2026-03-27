//package com.yogimangchi.domain.asset.service;
//import com.yogimangchi.domain.asset.dto.request.ParticipateRequestDto;
//import com.yogimangchi.domain.asset.dto.response.HoldingResponseDto;
//import com.yogimangchi.domain.asset.dto.response.PortfolioResponseDto;
//import com.yogimangchi.domain.asset.entity.Assets;
//import com.yogimangchi.domain.asset.entity.Holding;
//import com.yogimangchi.domain.asset.entity.PortfolioSnapshot;
//import com.yogimangchi.domain.asset.enums.AssetType;
//import com.yogimangchi.domain.asset.repository.AssetRepository;
//import com.yogimangchi.domain.asset.repository.HoldingRepository;
//import com.yogimangchi.domain.asset.repository.PortfolioSnapshotRepository;
//import com.yogimangchi.domain.chartapi.dto.ChartPriceDto;
//import com.yogimangchi.domain.chartapi.repository.ChartPriceRepository;
//import com.yogimangchi.domain.member.entity.Member;
//import com.yogimangchi.domain.member.repository.MemberRepository;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.math.BigDecimal;
//import java.math.RoundingMode;
//import java.time.LocalDateTime;
//import java.time.YearMonth;
//import java.util.*;
//
//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class AssetService {
//
//    private final AssetRepository assetRepository;
//    private final MemberRepository memberRepository;
//    private final HoldingRepository holdingRepository;
//    private final ChartPriceRepository chartPriceRepository;
//    private final PortfolioSnapshotRepository portfolioSnapshotRepository;
//    private final ObjectMapper objectMapper;
//
//    @Transactional
//    public void participate(Long memberId, ParticipateRequestDto request) {
//        Member member = memberRepository.findByIdForUpdate(memberId)
//                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
//
//        // 이미 진행 중인(ACTIVE) 동일한 타입의 지갑이 있는지 확인
//        Optional<Assets> activeWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, request.assetType(), "ACTIVE");
//        if (activeWallet.isPresent()) {
//            throw new IllegalArgumentException("이미 진행 중인 콘텐츠입니다. 새롭게 시작하려면 재도전해 주세요.");
//        }
//
//        // 재도전 횟수 계산 로직
//        int currentRetryCount = 0;
//        int maxRetryLimit = (request.assetType() == AssetType.CONTEST) ? 0 :5;
//
//        Optional<Assets> lastWallet = assetRepository.findTopByMemberIdAndTypeOrderByRetryCountDesc(memberId, request.assetType());
//
//        if (lastWallet.isPresent()) {
//            currentRetryCount = lastWallet.get().getRetryCount() + 1; // 이전 횟수 + 1
//            if (currentRetryCount > maxRetryLimit) {
//                throw new IllegalArgumentException("최대 재도전 횟수(" + maxRetryLimit + "회)를 모두 소진했습니다. 다음 시즌에 이용해주세요.");
//            }
//        }
//
//        // 만료일(expiredAt) 계산 로직
//        LocalDateTime expiredAt = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);
//
//        // 초기 자금 설정 (10만 달러)
//        BigDecimal initialMoney = new BigDecimal("100000");
//
//        // 새 지갑 생성 및 저장
//        Assets newWallet = Assets.createNewWallet(member, request.assetType(), initialMoney, currentRetryCount, expiredAt);
//        assetRepository.save(newWallet);
//        log.info("[참가] memberId={}, type={}, retryCount={}, walletId={}", memberId, request.assetType(), currentRetryCount, newWallet.getId());
//    }
//
//
//    @Transactional
//    public void giveUp(Long memberId, ParticipateRequestDto request) {
//        // 대회는 재도전 기회가 없기 때문에 포기할 수 없게 설정
//        if (request.assetType() == AssetType.CONTEST) {
//            throw new IllegalArgumentException("대회 진행 중에는 포기할 수 없습니다. 끝까지 완주해 주세요!");
//        }
//
//        memberRepository.findByIdForUpdate(memberId)
//                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
//
//        // 사용자의 활성화된 지갑찾기
//        Assets activeWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, request.assetType(), "ACTIVE")
//                .orElseThrow(() -> new IllegalArgumentException("현재 진행 중인 " + request.assetType() + " 콘텐츠가 없습니다."));
//
//        // 보유 코인 목록 조회
//        List<Holding> holdings = holdingRepository.findAllByAssets(activeWallet);
//
//        // 포기 시점의 코인별 상세 계산 + JSON 변환
//        BigDecimal totalCoinValue = BigDecimal.ZERO;
//        List<Map<String, Object>> holdingDetails = new ArrayList<>();
//
//        for (Holding holding : holdings) {
//            BigDecimal currentPrice = chartPriceRepository.findBySymbol(holding.getSymbol())
//                    .map(dto -> new BigDecimal(dto.price()))
//                    .orElse(holding.getAverageBuyPrice());
//
//            BigDecimal coinValue = holding.getQuantity().multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);
//            BigDecimal buyAmount = holding.getQuantity().multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
//            BigDecimal profit = coinValue.subtract(buyAmount);
//            BigDecimal roi = BigDecimal.ZERO;
//            if (buyAmount.compareTo(BigDecimal.ZERO) > 0) {
//                roi = profit.multiply(new BigDecimal("100")).divide(buyAmount, 2, RoundingMode.HALF_UP);
//            }
//
//            Map<String, Object> detail = new LinkedHashMap<>();
//            detail.put("symbol", holding.getSymbol());
//            detail.put("quantity", holding.getQuantity());
//            detail.put("averageBuyPrice", holding.getAverageBuyPrice());
//            detail.put("lastPrice", currentPrice);
//            detail.put("buyAmount", buyAmount);
//            detail.put("coinValue", coinValue);
//            detail.put("profit", profit);
//            detail.put("roi", roi);
//            holdingDetails.add(detail);
//
//            totalCoinValue = totalCoinValue.add(coinValue);
//        }
//
//        // JSON 직렬화
//        String holdingsJson;
//        try {
//            holdingsJson = objectMapper.writeValueAsString(holdingDetails);
//        } catch (Exception e) {
//            throw new IllegalStateException("보유 코인 정보 변환 중 오류가 발생했습니다.", e);
//        }
//
//        // 스냅샷 계산
//        BigDecimal cashBalance = activeWallet.getCurrentMoney();
//        BigDecimal totalAsset = cashBalance.add(totalCoinValue);
//        BigDecimal seedMoney = activeWallet.getSeedMoney();
//        BigDecimal profitAmount = totalAsset.subtract(seedMoney);
//        BigDecimal profitRate = BigDecimal.ZERO;
//        if (seedMoney.compareTo(BigDecimal.ZERO) > 0) {
//            profitRate = profitAmount.multiply(new BigDecimal("100")).divide(seedMoney, 2, RoundingMode.HALF_UP);
//        }
//
//        // 스냅샷 저장
//        PortfolioSnapshot snapshot = PortfolioSnapshot.createSnapshot(
//                activeWallet, cashBalance, totalCoinValue, totalAsset, profitAmount, profitRate, holdingsJson
//        );
//        portfolioSnapshotRepository.save(snapshot);
//
//        // Holding 삭제 (스냅샷에 기록했으므로 더 이상 불필요)
//        holdingRepository.deleteAll(holdings);
//
//        // 지갑의 상태를 만료(EXPIRED)로 변경
//        activeWallet.expireWallet();
//        log.info("[포기] memberId={}, type={}, walletId={}, 총자산={}, 수익률={}%", memberId, request.assetType(), activeWallet.getId(), totalAsset, profitRate);
//    }
//
//    // 포트폴리오 자산 조회
//    @Transactional(readOnly = true)
//    public PortfolioResponseDto getMyPortfolio(Long memberId, AssetType assetType) {
//        log.info("[포트폴리오 조회] memberId={}, type={}", memberId, assetType);
//
//        // 사용자 존재 여부 확인
//        memberRepository.findById(memberId)
//                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
//
//        // 내 지갑찾기
//        Assets myWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, assetType, "ACTIVE")
//                .orElseThrow(() -> new IllegalArgumentException("활성화된 " + assetType + " 지갑을 찾을 수 없습니다."));
//
//        // 내가 보유중인 코인 목록 조회
//        List<Holding> myHoldings = holdingRepository.findAllByAssets(myWallet);
//
//        // 1차 pass: 코인별 계산값 집계 + 총합 산출
//        BigDecimal totalCoinValue = BigDecimal.ZERO; // 총 평가 금액
//        BigDecimal totalBuyAmount = BigDecimal.ZERO; // 총 매수 금액
//
//        // 중간 계산 결과를 임시로 담아둘 리스트 (holdingRatio는 아직 미정)
//        record HoldingCalc(String symbol, BigDecimal quantity, BigDecimal averageBuyPrice,
//                           BigDecimal currentPrice, BigDecimal buyAmount,
//                           BigDecimal coinTotalValue, BigDecimal profit, BigDecimal roi, boolean isPriceStale) {}
//
//        List<HoldingCalc> holdingCalcs = new ArrayList<>();
//
//        for (Holding holding : myHoldings) {
//            // 바이낸스 실시간 가격 조회 시도
//            Optional<ChartPriceDto> priceOpt = chartPriceRepository.findBySymbol(holding.getSymbol());
//            boolean isPriceStale = priceOpt.isEmpty(); // 가격을 못 가져오면 stale
//            BigDecimal currentPrice = priceOpt
//                    .map(dto -> new BigDecimal(dto.price()))
//                    .orElse(holding.getAverageBuyPrice()); // fallback: 매수 평균가
//
//            // 현재 평가 금액 = 수량 × 현재가
//            BigDecimal coinTotalValue = holding.getQuantity().multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);
//
//            // 매수 원금 = 수량 × 평단가
//            BigDecimal buyAmount = holding.getQuantity().multiply(holding.getAverageBuyPrice()).setScale(4, RoundingMode.HALF_UP);
//
//            // 평가 손익 = 현재 평가 금액 - 원금
//            BigDecimal profit = coinTotalValue.subtract(buyAmount);
//
//            // 수익률% = (손익 × 100) / 매수금액
//            // 소수점 증발 방지를 위해 100을 먼저 곱함
//            BigDecimal roi = BigDecimal.ZERO;
//            if (buyAmount.compareTo(BigDecimal.ZERO) > 0) {
//                roi = profit.multiply(new BigDecimal("100")).divide(buyAmount, 2, RoundingMode.HALF_UP);
//            }
//
//            // 임시로 데이터를 담아두고 내 전체 코인에 금액 합치기
//            holdingCalcs.add(new HoldingCalc(
//                    holding.getSymbol(), holding.getQuantity(), holding.getAverageBuyPrice(),
//                    currentPrice, buyAmount, coinTotalValue, profit, roi, isPriceStale
//            ));
//
//            totalCoinValue = totalCoinValue.add(coinTotalValue);
//            totalBuyAmount = totalBuyAmount.add(buyAmount);
//        }
//
//        // 2차 pass: holdingRatio(자산 비중 %) 계산 후 최종 DTO 생성
//        List<HoldingResponseDto> holdingResponseDtos = new ArrayList<>();
//        for (HoldingCalc calc : holdingCalcs) {
//            BigDecimal holdingRatio = BigDecimal.ZERO;
//            if (totalCoinValue.compareTo(BigDecimal.ZERO) > 0) {
//                holdingRatio = calc.coinTotalValue()
//                        .multiply(new BigDecimal("100"))
//                        .divide(totalCoinValue, 2, RoundingMode.HALF_UP);
//            }
//
//            holdingResponseDtos.add(new HoldingResponseDto(
//                    calc.symbol(), calc.quantity(), calc.averageBuyPrice(),
//                    calc.currentPrice(), calc.buyAmount(), calc.coinTotalValue(),
//                    calc.profit(), calc.roi(), holdingRatio, calc.isPriceStale()
//            ));
//        }
//
//        // 전체 계좌 요약(현금 + 코인총액)
//        BigDecimal cashBalance = myWallet.getCurrentMoney();
//        BigDecimal totalAsset = cashBalance.add(totalCoinValue);
//
//        BigDecimal seedMoney = myWallet.getSeedMoney();
//        BigDecimal totalProfit = totalAsset.subtract(seedMoney);
//
//        BigDecimal totalRoi = BigDecimal.ZERO;
//        if (seedMoney.compareTo(BigDecimal.ZERO) > 0) {
//            totalRoi = totalProfit.multiply(new BigDecimal("100")).divide(seedMoney, 2, RoundingMode.HALF_UP);
//        }
//
//        return new PortfolioResponseDto(
//                assetType.name(),
//                holdingResponseDtos.size(),
//                seedMoney,
//                cashBalance,
//                totalBuyAmount,
//                totalCoinValue,
//                totalAsset,
//                totalProfit,
//                totalRoi,
//                holdingResponseDtos
//        );
//    }
//
//}