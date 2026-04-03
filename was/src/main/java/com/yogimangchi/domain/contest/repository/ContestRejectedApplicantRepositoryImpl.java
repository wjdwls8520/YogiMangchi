package com.yogimangchi.domain.contest.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.dto.query.ContestRejectedApplicantQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.member.entity.QMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.yogimangchi.domain.contest.entity.QContestRejectedApplicant.contestRejectedApplicant;
import static com.yogimangchi.domain.member.entity.QMember.member;

@Repository
@RequiredArgsConstructor
public class ContestRejectedApplicantRepositoryImpl implements ContestRejectedApplicantRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<ContestRejectedApplicantQueryDto> searchRejectedContestApplicants(Long seasonId, ContestApplicantSearchDto request) {
        QMember rejectedAdmin = new QMember("rejectedAdmin");

        return queryFactory
                .select(Projections.constructor(
                        ContestRejectedApplicantQueryDto.class,
                        contestRejectedApplicant.id,
                        member.id,
                        member.nickname,
                        member.profileImgUrl,
                        contestRejectedApplicant.appliedAt,
                        contestRejectedApplicant.rejectedAt,
                        contestRejectedApplicant.rejectReason,
                        rejectedAdmin.id,
                        rejectedAdmin.nickname,
                        rejectedAdmin.profileImgUrl
                ))
                .from(contestRejectedApplicant)
                .join(contestRejectedApplicant.member, member)
                .join(rejectedAdmin).on(rejectedAdmin.id.eq(contestRejectedApplicant.rejectedByAdminId))
                .where(
                        seasonIdEq(seasonId),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestRejectedApplicant.id.desc())
                .limit(request.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression seasonIdEq(Long seasonId) {
        return contestRejectedApplicant.contestSeason.id.eq(seasonId);
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestRejectedApplicant.id.lt(cursorId) : null;
    }
}
