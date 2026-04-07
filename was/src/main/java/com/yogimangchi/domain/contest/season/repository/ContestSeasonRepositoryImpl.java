package com.yogimangchi.domain.contest.season.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import static com.yogimangchi.domain.contest.season.entity.QContestSeason.contestSeason;

@Repository
@RequiredArgsConstructor
public class ContestSeasonRepositoryImpl implements ContestSeasonRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<ContestSeason> searchApplicableContestSeasons(ContestSeasonSearchDto request, LocalDateTime now) {
        int limitSize = request.getOrDefaultSize();

        return queryFactory
                .selectFrom(contestSeason)
                .where(
                        isApplicableAt(now),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestSeason.id.desc())
                .limit(limitSize + 1L)
                .fetch();
    }

    private BooleanExpression isApplicableAt(LocalDateTime now) {
        return contestSeason.isPublic.isTrue()
                .and(contestSeason.isCancel.isFalse())
                .and(contestSeason.recruitmentStartAt.loe(now))
                .and(contestSeason.recruitmentEndAt.goe(now));
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestSeason.id.lt(cursorId) : null;
    }
}
