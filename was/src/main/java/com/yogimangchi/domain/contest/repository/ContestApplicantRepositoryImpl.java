package com.yogimangchi.domain.contest.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.dto.query.ContestApplicantQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.yogimangchi.domain.contest.entity.QContestApplicant.contestApplicant;
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
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestApplicant.id.desc())
                .limit(request.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression seasonIdEq(Long seasonId) {
        return contestApplicant.contestSeason.id.eq(seasonId);
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestApplicant.id.lt(cursorId) : null;
    }
}
