package com.yogimangchi.domain.futures.service;

import com.yogimangchi.domain.asset.entity.Assets;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.repository.AssetRepository;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.repository.ContestSeasonRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.global.exception.contest.ContestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FuturesService {

    private final AssetRepository assetRepository;
    private final ContestSeasonRepository contestSeasonRepository;

    @Transactional
    public void createContestFuturesAsset(Long adminId, ContestSeason targetSeason, Member member) {

        // 초기 자금 1만 요기달러
        BigDecimal initialMoney = new BigDecimal("10000");

        Assets saveWallet = Assets.createNewWallet(
                member,
                AssetType.CONTEST,
                initialMoney,
                0,
                targetSeason.getContestEndAt()
        );
        assetRepository.save(saveWallet);

    }
}
