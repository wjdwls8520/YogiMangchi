package com.yogimangchi.domain.contest.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.member.entity.QMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.yogimangchi.domain.contest.entity.QContestParticipant.contestParticipant;
import static com.yogimangchi.domain.member.entity.QMember.member;

@Repository
@RequiredArgsConstructor
public class ContestParticipantRepositoryImpl implements ContestParticipantRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<ContestParticipantQueryDto> searchContestParticipants(Long seasonId, ContestApplicantSearchDto request) {
        QMember approvedAdmin = new QMember("approvedAdmin");

        return queryFactory
                .select(Projections.constructor(
                        ContestParticipantQueryDto.class,
                        contestParticipant.id,
                        member.id,
                        member.nickname,
                        member.profileImgUrl,
                        contestParticipant.appliedAt,
                        contestParticipant.approvedAt,
                        approvedAdmin.id,
                        approvedAdmin.nickname,
                        approvedAdmin.profileImgUrl
                ))
                .from(contestParticipant)
                .join(contestParticipant.member, member)
                .join(approvedAdmin).on(approvedAdmin.id.eq(contestParticipant.approvedByAdminId))
                .where(
                        seasonIdEq(seasonId),
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestParticipant.id.desc())
                .limit(request.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression seasonIdEq(Long seasonId) {
        return contestParticipant.contestSeason.id.eq(seasonId);
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestParticipant.id.lt(cursorId) : null;
    }
}
