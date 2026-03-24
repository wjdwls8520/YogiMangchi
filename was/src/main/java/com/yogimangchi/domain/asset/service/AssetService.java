package com.yogimangchi.domain.asset.service;
import com.yogimangchi.domain.asset.dto.request.ParticipateRequestDto;
import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final MemberRepository memberRepository;

    @Transactional
    public void participate(Long memberId, ParticipateRequestDto request) {
        Member member = memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 이미 진행 중인(ACTIVE) 동일한 타입의 지갑이 있는지 확인
        Optional<Assets> activeWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, request.assetType(), "ACTIVE");
        if (activeWallet.isPresent()) {
            throw new IllegalArgumentException("이미 진행 중인 콘텐츠입니다. 새롭게 시작하려면 재도전해 주세요.");
        }

        // 재도전 횟수 계산 로직
        int currentRetryCount = 0;
        int maxRetryLimit = (request.assetType() == AssetType.CONTEST) ? 2 :5;

        Optional<Assets> lastWallet = assetRepository.findTopByMemberIdAndTypeOrderByRetryCountDesc(memberId, request.assetType());

        if (lastWallet.isPresent()) {
            currentRetryCount = lastWallet.get().getRetryCount() + 1; // 이전 횟수 + 1
            if (currentRetryCount > maxRetryLimit) {
                throw new IllegalArgumentException("최대 재도전 횟수(" + maxRetryLimit + "회)를 모두 소진했습니다. 다음 시즌에 이용해주세요.");
            }
        }

        // 만료일(expiredAt) 계산 로직
        LocalDateTime expiredAt;
        if (request.assetType() == AssetType.CONTEST) {
            expiredAt = YearMonth.now().atEndOfMonth().atTime(23, 59, 59);
        } else {
            expiredAt = LocalDateTime.now().plusDays(14);
        }

        // 초기 자금 설정 (10만 달러)
        BigDecimal initialMoney = new BigDecimal("100000");

        // 새 지갑 생성 및 저장
        Assets newWallet = Assets.createNewWallet(member, request.assetType(), initialMoney, currentRetryCount, expiredAt);
        assetRepository.save(newWallet);
    }


    @Transactional
    public void giveUp(Long memberId, ParticipateRequestDto request) {
        memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 사용자의 활성화된 지갑찾기
        Assets activeWallet = assetRepository.findByMemberIdAndTypeAndStatus(memberId, request.assetType(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException("현재 진행 중인 " + request.assetType() + " 콘텐츠가 없습니다."));

        // 지갑의 상태를 만료(EXPIRED)로 변경
        activeWallet.expireWallet();

    }
}