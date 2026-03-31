package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import com.yogimangchi.domain.contest.repository.ContestSeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContestService {

    private final ContestSeasonRepository contestSeasonRepository;

    @Transactional(readOnly = true)
    public ContestSeasonDetailDto getLatestContestSeason() {
        ContestSeason latestSeason = contestSeasonRepository.findTopByStatusInOrderByContestStartAtDesc(
                List.of(ContestSeasonStatus.RECRUITING)
        ).orElseThrow(() -> new IllegalArgumentException("참가 모집중인 대회 시즌이 없습니다."));;

        return ContestSeasonDetailDto.from(latestSeason);
    }
}
