package com.yogimangchi.domain.contest.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.dto.query.ContestSeasonQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.entity.QContestSeason;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.yogimangchi.domain.contest.entity.QContestSeason.contestSeason;

@Repository
@RequiredArgsConstructor
public class ContestSeasonRepositoryImpl implements ContestSeasonRepositoryCustom {
    private final JPAQueryFactory queryFactory;

    @Override
    public List<ContestSeasonQueryDto> searchContestSeasons(ContestSeasonSearchDto request) {

        return queryFactory
                .select(Projections.constructor(
                        ContestSeasonQueryDto.class,
                        contestSeason.id,
                        contestSeason.title,
                        contestSeason.description,
                        contestSeason.recruitmentStartAt,
                        contestSeason.recruitmentEndAt,
                        contestSeason.contestStartAt,
                        contestSeason.contestEndAt,
                        contestSeason.createdAt,
                        contestSeason.updatedAt,
                        contestSeason.status
                ))
                .from(contestSeason)
                .where(cursorIdLt(request.cursorId()))
                .orderBy(contestSeason.id.desc())
                .limit(request.getOrDefaultSize() + 1)
                .fetch();
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestSeason.id.lt(cursorId) : null;
    }

}
