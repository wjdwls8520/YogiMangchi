package com.yogimangchi.domain.contest.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.entity.ContestSeason;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.yogimangchi.domain.contest.entity.QContestSeason.contestSeason;

@Repository
@RequiredArgsConstructor
public class ContestSeasonRepositoryImpl implements ContestSeasonRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<ContestSeason> searchApplicableContestSeasons(ContestSeasonSearchDto request) {
        // 요청 size 를 기본값/최댓값 규칙에 맞게 정리한다.
        int limitSize = request.getOrDefaultSize();

        // 참가 신청 가능한 시즌만 커서 기준으로 내림차순 조회한다.
        return queryFactory
                .selectFrom(contestSeason)
                .where(
                        applicableStatusIn(),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestSeason.id.desc())
                .limit(limitSize + 1L)
                .fetch();
    }

    private BooleanExpression applicableStatusIn() {
        // 모집중이거나 진행중인 시즌만 조회 조건에 포함한다.
        return contestSeason.status.in(ContestSeasonStatus.RECRUITING, ContestSeasonStatus.LIVE);
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        // 첫 요청이 아니면 이전 커서보다 작은 ID 부터 조회한다.
        return cursorId != null ? contestSeason.id.lt(cursorId) : null;
    }
}
