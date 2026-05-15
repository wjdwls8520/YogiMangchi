package com.yogimangchi.domain.contest.participant.repository;

import com.querydsl.jpa.JPAExpressions;
import com.yogimangchi.domain.contest.participant.dto.response.ContestRankingDto;
import com.querydsl.core.Tuple;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipantSettlementAggregateDto;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipationSeasonQueryDto;
import com.yogimangchi.domain.contest.participant.dto.query.ContestParticipantQueryDto;
import com.yogimangchi.domain.contest.participant.dto.query.MyContestSeasonResultQueryDto;
import com.yogimangchi.domain.contest.application.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import com.yogimangchi.domain.member.entity.QMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.yogimangchi.domain.asset.entity.QAssets.assets;
import static com.yogimangchi.domain.contest.participant.entity.QContestParticipant.contestParticipant;
import static com.yogimangchi.domain.contest.season.entity.QContestSeason.contestSeason;
import static com.yogimangchi.domain.futures.entity.QFuturesPosition.futuresPosition;
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
                        contestSeason.isCancel,
                        contestSeason.settledAt
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

    // 참가자 최종 결과 산출 집계 — 참가자별 (실현손익 합, 시드머니 합) 산출
    //
    // 구현 전략
    //   하나의 큰 JOIN(participant × assets × position)은 시드머니가 포지션 수만큼 곱해져 SUM 이 부풀려진다.
    //   이를 피하려면 SUM(DISTINCT) 같은 트릭이 필요한데 가독성/유지보수가 떨어진다.
    //   따라서 두 쿼리로 분리하여 자바 단에서 묶는다:
    //     쿼리 A — 참가자별 SUM(CLOSE 포지션 realizedPnl)
    //     쿼리 B — 참가자별 SUM(CONTEST 지갑 seedMoney)
    //   참가자 수 N 에 대해 2 쿼리만 발생하므로 N+1 도 아니고, 행 곱하기 문제도 없다.
    //
    // 멤버-시즌 매칭으로 자산을 연결
    //   ContestParticipant ↔ Assets 직접 FK 가 없으므로 (member, contestSeason) 로 매칭한다.
    //   AssetType.CONTEST 필터로 다른 지갑 타입(MOCK, TRADE_SPOT, TRADE_FUTURE) 제외.
    //
    // 정산 이후엔 시즌 내 모든 OPEN 포지션이 CLOSE 로 전환되므로 PositionStatus.CLOSE 필터로 모든 포지션 포함됨.
    @Override
    public List<ContestParticipantSettlementAggregateDto> findSettlementAggregates(Long seasonId) {

        // 쿼리 A — 참가자 ID → CLOSE 포지션의 realizedPnl 합
        // LEFT JOIN 으로 포지션 한 건도 없는 참가자도 0 으로 잡힘
        List<Tuple> pnlRows = queryFactory
                .select(contestParticipant.id, futuresPosition.realizedPnl.sum())
                .from(contestParticipant)
                .leftJoin(assets).on(
                        assets.member.id.eq(contestParticipant.member.id)
                                .and(assets.contestSeason.id.eq(contestParticipant.contestSeason.id))
                                .and(assets.type.eq(AssetType.CONTEST))
                )
                .leftJoin(futuresPosition).on(
                        futuresPosition.assets.id.eq(assets.id)
                                .and(futuresPosition.positionStatus.eq(PositionStatus.CLOSE))
                )
                .where(contestParticipant.contestSeason.id.eq(seasonId))
                .groupBy(contestParticipant.id)
                .fetch();

        // 쿼리 B — 참가자 ID → CONTEST 지갑 seedMoney 합
        // 한 참가자가 시즌 내에서 회차(retry) 로 여러 지갑을 가질 수 있어 SUM 사용
        List<Tuple> seedRows = queryFactory
                .select(contestParticipant.id, assets.seedMoney.sum())
                .from(contestParticipant)
                .leftJoin(assets).on(
                        assets.member.id.eq(contestParticipant.member.id)
                                .and(assets.contestSeason.id.eq(contestParticipant.contestSeason.id))
                                .and(assets.type.eq(AssetType.CONTEST))
                )
                .where(contestParticipant.contestSeason.id.eq(seasonId))
                .groupBy(contestParticipant.id)
                .fetch();

        // 쿼리 B 결과를 Map 으로 인덱싱 → 쿼리 A 순회 시 O(1) lookup
        Map<Long, BigDecimal> seedByParticipant = new HashMap<>();
        for (Tuple row : seedRows) {
            Long participantId = row.get(contestParticipant.id);
            BigDecimal seedSum = row.get(assets.seedMoney.sum());
            seedByParticipant.put(participantId, seedSum != null ? seedSum : BigDecimal.ZERO);
        }

        // 쿼리 A 기준으로 합쳐 DTO 생성 — 참가자가 곧 결과 행의 단위
        List<ContestParticipantSettlementAggregateDto> aggregates = new java.util.ArrayList<>(pnlRows.size());
        for (Tuple row : pnlRows) {
            Long participantId = row.get(contestParticipant.id);
            BigDecimal pnlSum = row.get(futuresPosition.realizedPnl.sum());
            aggregates.add(new ContestParticipantSettlementAggregateDto(
                    participantId,
                    pnlSum != null ? pnlSum : BigDecimal.ZERO,
                    seedByParticipant.getOrDefault(participantId, BigDecimal.ZERO)
            ));
        }
        return aggregates;
    }

    // 사용자 본인 시즌 결과 단일 조회 — 박제값과 시즌 메타를 한 번의 SELECT 로 묶어 반환
    //
    // settledAt 분기는 호출자(서비스) 책임
    //   - settledAt NULL → CONTEST_SEASON_NOT_SETTLED 예외 변환
    //   - settledAt NOT NULL → 박제값 응답
    //
    // 참가자 행 자체가 없는 케이스는 Optional.empty() 로 반환 → 서비스에서 NotFound 변환
    @Override
    public Optional<MyContestSeasonResultQueryDto> findMyContestSeasonResult(Long memberId, Long seasonId) {
        MyContestSeasonResultQueryDto result = queryFactory
                .select(com.querydsl.core.types.Projections.constructor(
                        MyContestSeasonResultQueryDto.class,
                        contestParticipant.id,
                        contestSeason.id,
                        contestSeason.title,
                        contestSeason.contestStartAt,
                        contestSeason.contestEndAt,
                        contestSeason.settledAt,
                        contestParticipant.finalRealizedPnl,
                        contestParticipant.finalProfitRate,
                        contestParticipant.finalRank
                ))
                .from(contestParticipant)
                .join(contestParticipant.contestSeason, contestSeason)
                .where(
                        contestParticipant.member.id.eq(memberId),
                        contestSeason.id.eq(seasonId)
                )
                .fetchOne();

        return Optional.ofNullable(result);
    }

    @Override
    public List<ContestRankingDto> findContestRankings(Long seasonId, ContestCursorSearchDto request) {
        return queryFactory
                .select(Projections.constructor(
                        ContestRankingDto.class,
                        contestParticipant.finalRank,
                        contestParticipant.id,
                        member.id,
                        member.nickname,
                        member.profileImgUrl,
                        contestParticipant.finalRealizedPnl,
                        contestParticipant.finalProfitRate
                ))
                .from(contestParticipant)
                .join(contestParticipant.member, member)
                .where(
                        contestParticipant.contestSeason.id.eq(seasonId),
                        contestParticipant.finalRank.isNotNull(),
                        rankingCursorCondition(request.cursorId())
                )
                .orderBy(contestParticipant.finalRank.asc(), contestParticipant.id.asc())
                .limit(request.getOrDefaultSize() + 1L)
                .fetch();
    }

    private BooleanExpression rankingCursorCondition(Long cursorId) {
        if (cursorId == null) {
            return null;
        }

        // 현재 커서(참가자 ID)의 순위를 서브쿼리로 가져와 비교한다. (순위 ASC, ID ASC 정렬 기준)
        // (rank > lastRank) OR (rank == lastRank AND id > lastId)
        return contestParticipant.finalRank.gt(
                JPAExpressions.select(contestParticipant.finalRank)
                        .from(contestParticipant)
                        .where(contestParticipant.id.eq(cursorId))
        ).or(
                contestParticipant.finalRank.eq(
                        JPAExpressions.select(contestParticipant.finalRank)
                                .from(contestParticipant)
                                .where(contestParticipant.id.eq(cursorId))
                ).and(contestParticipant.id.gt(cursorId))
        );
    }
}
