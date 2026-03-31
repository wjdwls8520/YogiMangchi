package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.repository.AdminContestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminContestService {

    private final AdminContestRepository adminContestRepository;

    @Transactional
    public ContestSeasonDetailDto createContest(Long adminId, ContestCreateDto request) {

        ContestSeason contestSeason = ContestSeason.create(
                request.title(),
                request.description(),
                request.recruitmentStartAt(),
                request.recruitmentEndAt(),
                request.contestStartAt(),
                request.contestEndAt()
        );
        ContestSeason savedContestSeason = adminContestRepository.save(contestSeason);

        return ContestSeasonDetailDto.from(savedContestSeason);

    }
}
