package com.yogimangchi.domain.contest.application.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.application.dto.query.ContestApplicantQueryDto;
import com.yogimangchi.domain.contest.application.dto.query.MyContestPendingApplicationQueryDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.yogimangchi.domain.contest.application.entity.QContestApplicant.contestApplicant;
import static com.yogimangchi.domain.contest.season.entity.QContestSeason.contestSeason;
import static com.yogimangchi.domain.member.entity.QMember.member;

@Repository
@RequiredArgsConstructor
public class ContestApplicantRepositoryImpl implements ContestApplicantRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<ContestApplicantQueryDto> searchContestApplicants(Long seasonId, ContestApplicantSearchDto request) {
        return queryFactory
                .select(Projections.constructor(
                        ContestApplicantQueryDto.class,
                        contestApplicant.id,
                        member.id,
                        member.nickname,
                        member.profileImgUrl,
                        contestApplicant.createdAt
                ))
                .from(contestApplicant)
                .join(contestApplicant.member, member)
                .where(
                        seasonIdEq(seasonId),
                        member.deleteYn.eq("N"),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestApplicant.id.desc())
                .limit(request.getOrDefaultSize() + 1L)
                .fetch();
    }

    @Override
    public List<MyContestPendingApplicationQueryDto> searchPendingContestApplications(Long memberId, ContestCursorSearchDto request) {
        return queryFactory
                .select(Projections.constructor(
                        MyContestPendingApplicationQueryDto.class,
                        contestApplicant.id,
                        contestApplicant.createdAt,
                        contestSeason.id,
                        contestSeason.title,
                        contestSeason.description,
                        contestSeason.recruitmentStartAt,
                        contestSeason.recruitmentEndAt,
                        contestSeason.contestStartAt,
                        contestSeason.contestEndAt,
                        contestSeason.createdAt,
                        contestSeason.updatedAt,
                        contestSeason.isPublic,
                        contestSeason.isCancel
                ))
                .from(contestApplicant)
                .join(contestApplicant.contestSeason, contestSeason)
                .where(
                        memberIdEq(memberId),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestApplicant.id.desc())
                .limit(request.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression seasonIdEq(Long seasonId) {
        return contestApplicant.contestSeason.id.eq(seasonId);
    }

    private BooleanExpression memberIdEq(Long memberId) {
        return contestApplicant.member.id.eq(memberId);
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestApplicant.id.lt(cursorId) : null;
    }
}
