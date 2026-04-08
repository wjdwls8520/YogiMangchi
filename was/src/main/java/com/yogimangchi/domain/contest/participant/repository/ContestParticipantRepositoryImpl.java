package com.yogimangchi.domain.contest.participant.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipationSeasonQueryDto;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.member.entity.QMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import static com.yogimangchi.domain.contest.participant.entity.QContestParticipant.contestParticipant;
import static com.yogimangchi.domain.contest.season.entity.QContestSeason.contestSeason;
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
    public List<ContestParticipationSeasonQueryDto> searchParticipatingContestSeasons(
            Long memberId,
            ContestCursorSearchDto request,
            LocalDateTime now
    ) {
        return queryContestParticipationSeasons(memberId, request, currentSeasonCondition(now));
    }

    @Override
    public List<ContestParticipationSeasonQueryDto> searchContestParticipationSeasons(
            Long memberId,
            ContestCursorSearchDto request,
            LocalDateTime now
    ) {
        return queryContestParticipationSeasons(memberId, request, visibleSeasonCondition(now));
    }

    private BooleanExpression seasonIdEq(Long seasonId) {
        return contestParticipant.contestSeason.id.eq(seasonId);
    }

    private List<ContestParticipationSeasonQueryDto> queryContestParticipationSeasons(
            Long memberId,
            ContestCursorSearchDto request,
            BooleanExpression seasonCondition
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
                        contestSeason.isPublic,
                        contestSeason.isCancel
                ))
                .from(contestParticipant)
                .join(contestParticipant.contestSeason, contestSeason)
                .where(
                        memberIdEq(memberId),
                        seasonCondition,
                        cursorIdLt(request.cursorId())
                )
                .orderBy(contestParticipant.id.desc())
                .limit(request.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression memberIdEq(Long memberId) {
        return contestParticipant.member.id.eq(memberId);
    }

    private BooleanExpression currentSeasonCondition(LocalDateTime now) {
        return contestSeason.isPublic.isTrue()
                .and(contestSeason.isCancel.isFalse())
                .and(contestSeason.recruitmentStartAt.loe(now))
                .and(contestSeason.contestEndAt.goe(now));
    }

    private BooleanExpression visibleSeasonCondition(LocalDateTime now) {
        return contestSeason.isPublic.isTrue()
                .and(contestSeason.recruitmentStartAt.loe(now));
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        return cursorId != null ? contestParticipant.id.lt(cursorId) : null;
    }
}
