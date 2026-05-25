package com.yogimangchi.domain.chartist.service;

import com.yogimangchi.domain.chartist.dto.request.ChartistCursorSearchDto;
import com.yogimangchi.domain.chartist.dto.response.ChartistRankingDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.participant.dto.response.ContestRankingDto;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.repository.ContestSeasonRepository;
import com.yogimangchi.domain.contest.participant.repository.ContestParticipantRepository;
import com.yogimangchi.global.dto.CursorResponseDto;
import com.yogimangchi.global.exception.contest.ContestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChartistService {

    private final ContestSeasonRepository contestSeasonRepository;
    private final ContestParticipantRepository contestParticipantRepository;

    /**
     * 특정 시즌의 전체 순위 리스트를 조회한다. (무한 스크롤)
     *
     * @param seasonId 조회할 시즌 ID
     * @param request  커서 및 사이즈 조건
     * @return 순위순으로 정렬된 커서 응답
     */
    @Transactional(readOnly = true)
    public CursorResponseDto<ChartistRankingDto> getChartistRankings(Long seasonId, ChartistCursorSearchDto request) {
        // 시즌 존재 여부 확인
        ContestSeason season = contestSeasonRepository.findById(seasonId)
                .orElseThrow(ContestException::contestSeasonNotFound);

        // 정산이 완료되지 않은 시즌은 랭킹 데이터(final_*)가 없으므로 빈 리스트 반환
        if (season.getSettledAt() == null) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        // ContestCursorSearchDto로 변환하여 기존 repository 로직 활용
        ContestCursorSearchDto searchDto = new ContestCursorSearchDto(request.cursorId(), request.size());

        // 박제된 데이터를 기반으로 순위순 조회
        List<ContestRankingDto> rankings = contestParticipantRepository.findContestRankings(seasonId, searchDto);

        int limitSize = searchDto.getOrDefaultSize();
        boolean hasNext = rankings.size() > limitSize;

        if (hasNext) {
            rankings = new ArrayList<>(rankings.subList(0, limitSize));
        }

        List<ChartistRankingDto> content = rankings.stream()
                .map(r -> new ChartistRankingDto(
                        r.rank(),
                        r.participantId(),
                        r.memberId(),
                        r.nickname(),
                        r.profileImgUrl(),
                        r.realizedPnl(),
                        r.profitRate()
                ))
                .toList();

        Long nextCursorId = hasNext && !rankings.isEmpty()
                ? rankings.get(rankings.size() - 1).participantId()
                : null;

        return new CursorResponseDto<>(content, nextCursorId, hasNext);
    }
}
