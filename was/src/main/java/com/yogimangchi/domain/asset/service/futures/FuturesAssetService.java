package com.yogimangchi.domain.asset.service.futures;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.global.exception.asset.AssetException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class FuturesAssetService {

    private final AssetRepository assetRepository;

    // 대회 전용 선물 지갑 생성 메서드.
    @Transactional
    public void createNewContestFuturesWallet(Long adminId, ContestSeason targetSeason, Member participant) {

        // 1. 먼저 지갑이 이미 존재하는지 확인
        if (assetRepository.existsByMemberAndTypeAndContestSeason(participant, AssetType.CONTEST, targetSeason)) {
            throw AssetException.walletAlreadyExists();
        }

        // 초기 자금 1만 요기달러
        BigDecimal initialMoney = new BigDecimal("10000");

        // 지갑 객체 생성
        Assets saveWallet = Assets.createNewContestFuturesWallet(
                participant,
                AssetType.CONTEST,
                initialMoney,
                0,
                targetSeason.getContestEndAt(),
                targetSeason
        );

        // 대회 선물 지갑을 생성 할 때는 비즈니스 의미가 분명하여 도메인에서 예외처리함.
        try {
            assetRepository.saveAndFlush(saveWallet);
        } catch (DataIntegrityViolationException e) {
            throw AssetException.walletAlreadyExists();
        }


        // [ 알람 ] 대회 참여를 알리는 알람.

    }
}
