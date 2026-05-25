package com.yogimangchi.domain.contest.service;

import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.season.dto.response.ContestSeasonPublicDto;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.repository.ContestSeasonRepository;
import com.yogimangchi.global.dto.CursorResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PublicContestService {

    private final ContestSeasonRepository contestSeasonRepository;

    /**
     * 참가 신청 중인 모든 대회 조회 (무한 스크롤)
     */
    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonPublicDto> getRecruitingContestSeasons(ContestSeasonSearchDto request) {
        LocalDateTime now = LocalDateTime.now();
        List<ContestSeason> seasons = contestSeasonRepository.searchPublicRecruitingContestSeasons(request, now);
        return toCursorResponseDto(seasons, request.getOrDefaultSize(), now);
    }

    /**
     * 진행 중인 모든 대회 조회 (무한 스크롤)
     */
    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonPublicDto> getRunningContestSeasons(ContestSeasonSearchDto request) {
        LocalDateTime now = LocalDateTime.now();
        List<ContestSeason> seasons = contestSeasonRepository.searchPublicRunningContestSeasons(request, now);
        return toCursorResponseDto(seasons, request.getOrDefaultSize(), now);
    }

    /**
     * 종료된 모든 대회 조회 (무한 스크롤)
     */
    @Transactional(readOnly = true)
    public CursorResponseDto<ContestSeasonPublicDto> getFinishedContestSeasons(ContestSeasonSearchDto request) {
        LocalDateTime now = LocalDateTime.now();
        List<ContestSeason> seasons = contestSeasonRepository.searchPublicFinishedContestSeasons(request, now);
        return toCursorResponseDto(seasons, request.getOrDefaultSize(), now);
    }

    private CursorResponseDto<ContestSeasonPublicDto> toCursorResponseDto(
            List<ContestSeason> seasons,
            int limitSize,
            LocalDateTime now
    ) {
        if (seasons.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = seasons.size() > limitSize;

        if (hasNext) {
            seasons = new ArrayList<>(seasons.subList(0, limitSize));
        }

        List<ContestSeasonPublicDto> content = seasons.stream()
                .map(season -> ContestSeasonPublicDto.from(season, now))
                .toList();

        Long nextCursorId = hasNext && !seasons.isEmpty()
                ? seasons.get(seasons.size() - 1).getId()
                : null;

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }
}
