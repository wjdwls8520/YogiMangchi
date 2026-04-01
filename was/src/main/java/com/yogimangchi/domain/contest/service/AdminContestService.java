package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.dto.query.ContestSeasonQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.repository.AdminContestSeasonRepository;
import com.yogimangchi.global.dto.CursorResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminContestService {

    private final AdminContestSeasonRepository adminContestRepository;

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

    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonDetailDto> getContestSeasons(ContestSeasonSearchDto request) {
        List<ContestSeasonQueryDto> seasons = adminContestRepository.searchContestSeasons(request);

        int limitSize = request.getOrDefaultSize();
        boolean hasNext = seasons.size() > limitSize;

        if (hasNext) {
            seasons.remove(limitSize);
        }

        Long nextCursorId = null;
        if (!seasons.isEmpty()) {
            nextCursorId = seasons.get(seasons.size() - 1).id();
        }

        List<ContestSeasonDetailDto> content = seasons.stream()
            .map(season -> new ContestSeasonDetailDto(
                    season.id(),
                    season.title(),
                    season.description(),
                    season.recruitmentStartAt(),
                    season.recruitmentEndAt(),
                    season.contestStartAt(),
                    season.contestEndAt(),
                    season.createdAt(),
                    season.updatedAt(),
                    season.status()
            ))
            .toList();

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }
}
