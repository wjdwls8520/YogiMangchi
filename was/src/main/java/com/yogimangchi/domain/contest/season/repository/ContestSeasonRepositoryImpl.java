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

    @Override
    public List<ContestSeason> searchPublicRecruitingContestSeasons(ContestSeasonSearchDto request, LocalDateTime now) {
        int limitSize = request.getOrDefaultSize();

        return queryFactory
                .selectFrom(contestSeason)
                .where(
                        contestSeason.isPublic.isTrue(),
                        contestSeason.isCancel.isFalse(),
                        contestSeason.recruitmentStartAt.loe(now),
                        contestSeason.recruitmentEndAt.goe(now),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestSeason.id.desc())
                .limit(limitSize + 1L)
                .fetch();
    }

    @Override
    public List<ContestSeason> searchPublicRunningContestSeasons(ContestSeasonSearchDto request, LocalDateTime now) {
        int limitSize = request.getOrDefaultSize();

        return queryFactory
                .selectFrom(contestSeason)
                .where(
                        contestSeason.isPublic.isTrue(),
                        contestSeason.isCancel.isFalse(),
                        contestSeason.contestStartAt.loe(now),
                        contestSeason.contestEndAt.goe(now),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestSeason.id.desc())
                .limit(limitSize + 1L)
                .fetch();
    }

    @Override
    public List<ContestSeason> searchPublicFinishedContestSeasons(ContestSeasonSearchDto request, LocalDateTime now) {
        int limitSize = request.getOrDefaultSize();

        return queryFactory
                .selectFrom(contestSeason)
                .where(
                        contestSeason.isPublic.isTrue(),
                        contestSeason.isCancel.isFalse(),
                        contestSeason.contestEndAt.lt(now),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestSeason.id.desc())
                .limit(limitSize + 1L)
                .fetch();
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestSeason.id.lt(cursorId) : null;
    }
}
