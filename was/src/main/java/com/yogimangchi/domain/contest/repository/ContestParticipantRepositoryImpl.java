package com.yogimangchi.domain.contest.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.dto.query.ContestParticipationSeasonQueryDto;
import com.yogimangchi.domain.contest.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import com.yogimangchi.domain.member.entity.QMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

import static com.yogimangchi.domain.contest.entity.QContestParticipant.contestParticipant;
import static com.yogimangchi.domain.contest.entity.QContestSeason.contestSeason;
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

    @Override
    public List<ContestParticipationSeasonQueryDto> searchParticipatingContestSeasons(Long memberId, ContestCursorSearchDto request) {
        return queryContestParticipationSeasons(memberId, request, currentSeasonStatusIn());
    }

    @Override
    public List<ContestParticipationSeasonQueryDto> searchContestParticipationSeasons(Long memberId, ContestCursorSearchDto request) {
        return queryContestParticipationSeasons(memberId, request, visibleHistorySeasonStatusIn());
    }

    private BooleanExpression seasonIdEq(Long seasonId) {
        return contestParticipant.contestSeason.id.eq(seasonId);
    }

    private List<ContestParticipationSeasonQueryDto> queryContestParticipationSeasons(
            Long memberId,
            ContestCursorSearchDto request,
            BooleanExpression seasonStatusCondition
    ) {
        return queryFactory
                .select(Projections.constructor(
                        ContestParticipationSeasonQueryDto.class,
                        contestParticipant.id,
                        contestParticipant.appliedAt,
                        contestParticipant.approvedAt,
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
                .from(contestParticipant)
                .join(contestParticipant.contestSeason, contestSeason)
                .where(
                        memberIdEq(memberId),
                        seasonStatusCondition,
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestParticipant.id.desc())
                .limit(request.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression memberIdEq(Long memberId) {
        return contestParticipant.member.id.eq(memberId);
    }

    private BooleanExpression currentSeasonStatusIn() {
        return contestSeason.status.in(ContestSeasonStatus.RECRUITING, ContestSeasonStatus.LIVE);
    }

    private BooleanExpression visibleHistorySeasonStatusIn() {
        return contestSeason.status.in(
                ContestSeasonStatus.RECRUITING,
                ContestSeasonStatus.LIVE,
                ContestSeasonStatus.FINISHED
        );
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestParticipant.id.lt(cursorId) : null;
    }
}
