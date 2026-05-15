package com.yogimangchi.domain.futures.repository.query;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.futures.dto.query.FuturesOpenPositionSymbolCountDto;
import com.yogimangchi.domain.futures.enums.PositionSide;
import com.yogimangchi.domain.futures.enums.PositionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static com.yogimangchi.domain.asset.entity.QAssets.assets;
import static com.yogimangchi.domain.futures.entity.QFuturesPosition.futuresPosition;

@Repository
@RequiredArgsConstructor
public class FuturesPositionRepositoryImpl implements FuturesPositionRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Long> findLongLiquidationCandidates(String symbol, BigDecimal minPrice, int size) {
        // 가격이 minPrice 이하로 내려와 LONG 청산이 트리거되는 포지션 ID 조회
        // 조건: liquidationPrice >= minPrice (청산가가 현재 최저가 이상이면 가격이 청산가를 통과)
        // 활성 지갑(ACTIVE + 미만료) 포지션만 대상 — 지정가 체결과 동일 정책
        return queryFactory
                .select(futuresPosition.id)
                .from(futuresPosition)
                .join(futuresPosition.assets, assets)
                .where(
                        symbolEq(symbol),
                        openLongPosition(),
                        activeAssetStatus(),
                        notExpiredAsset(),
                        longLiquidationTriggered(minPrice)
                )
                .orderBy(futuresPosition.id.asc()) // 진입 순서 보장
                .limit(size)
                .fetch();
    }

    @Override
    public List<Long> findShortLiquidationCandidates(String symbol, BigDecimal maxPrice, int size) {
        // 가격이 maxPrice 이상으로 올라가 SHORT 청산이 트리거되는 포지션 ID 조회
        // 조건: liquidationPrice <= maxPrice (청산가가 현재 최고가 이하면 가격이 청산가를 통과)
        // 활성 지갑(ACTIVE + 미만료) 포지션만 대상 — 지정가 체결과 동일 정책
        return queryFactory
                .select(futuresPosition.id)
                .from(futuresPosition)
                .join(futuresPosition.assets, assets)
                .where(
                        symbolEq(symbol),
                        openShortPosition(),
                        activeAssetStatus(),
                        notExpiredAsset(),
                        shortLiquidationTriggered(maxPrice)
                )
                .orderBy(futuresPosition.id.asc())
                .limit(size)
                .fetch();
    }

    @Override
    public List<FuturesOpenPositionSymbolCountDto> findOpenPositionCountsGroupBySymbol() {
        // 서버 재시작 시 강제청산 Registry 복원용 — 단일 쿼리로 심볼별 OPEN 포지션 카운트 일괄 조회
        // 비활성/만료 지갑의 포지션은 청산 대상에서 제외되므로 카운트에서도 제외 (지정가 부트스트랩과 동일 정책)
        return queryFactory
                .select(Projections.constructor(
                        FuturesOpenPositionSymbolCountDto.class,
                        futuresPosition.symbol,
                        futuresPosition.count()
                ))
                .from(futuresPosition)
                .join(futuresPosition.assets, assets)
                .where(
                        openPosition(),
                        activeAssetStatus(),
                        notExpiredAsset()
                )
                .groupBy(futuresPosition.symbol)
                .fetch();
    }

    @Override
    public List<String> findDistinctOpenSymbolsByContestSeason(Long contestSeasonId) {
        // 대회 정산 스냅샷 캡처 단계 — 시즌 내 OPEN 포지션의 심볼 distinct 목록
        // 어느 심볼들의 가격을 스냅샷으로 박제해야 하는지 판단하는 데 사용
        //
        // 지갑 활성/만료 필터는 적용하지 않음 — 정산은 시즌 내 "모든 잔여 OPEN 포지션"을 정리해야 하므로
        // 비활성 지갑(예: 사전에 어드민이 개별 비활성화한 경우)의 OPEN 포지션도 스냅샷 대상에 포함되어야 함
        //
        // assets.contestSeason.id 비교는 contest_season FK 컬럼 직접 비교로 변환되어
        // contest_season 테이블에 대한 추가 JOIN 은 발생하지 않음
        return queryFactory
                .select(futuresPosition.symbol)
                .distinct()
                .from(futuresPosition)
                .join(futuresPosition.assets, assets)
                .where(
                        openPosition(),
                        assets.contestSeason.id.eq(contestSeasonId)
                )
                .fetch();
    }

    @Override
    public List<Long> findOpenPositionIdsByContestSeasonAfterId(Long contestSeasonId, Long lastId, int size) {
        // 대회 정산 포지션 일괄 청산 단계 — 시즌 내 OPEN 포지션 ID keyset 페이징
        //
        // keyset 페이징을 쓰는 이유
        //   OFFSET 페이징은 N 번째 청크가 N*size 행을 스캔 → deep pagination 비효율
        //   id > lastId 조건은 PK 인덱스 시크로 즉시 점프 → 청크 수에 관계없이 일정 비용
        //
        // 활성/만료 필터 미적용 — 정산은 시즌 내 모든 잔여 OPEN 포지션을 정리해야 하므로
        // (스냅샷 캡처 단계와 동일 정책)
        return queryFactory
                .select(futuresPosition.id)
                .from(futuresPosition)
                .join(futuresPosition.assets, assets)
                .where(
                        openPosition(),
                        assets.contestSeason.id.eq(contestSeasonId),
                        futuresPosition.id.gt(lastId)
                )
                .orderBy(futuresPosition.id.asc())
                .limit(size)
                .fetch();
    }

    // 활성 상태 지갑만 — 비활성/만료 지갑의 포지션은 청산 대상에서 제외
    private BooleanExpression activeAssetStatus() {
        return assets.status.eq("ACTIVE");
    }

    // 만료 시각이 현재보다 미래인 지갑만 (시즌 종료 후 청산 방지)
    private BooleanExpression notExpiredAsset() {
        return assets.expiredAt.goe(LocalDateTime.now());
    }

    private BooleanExpression symbolEq(String symbol) {
        return symbol != null ? futuresPosition.symbol.eq(symbol.trim().toUpperCase()) : null;
    }

    // OPEN 상태 공통 조건
    private BooleanExpression openPosition() {
        return futuresPosition.positionStatus.eq(PositionStatus.OPEN);
    }

    // OPEN + LONG 방향
    private BooleanExpression openLongPosition() {
        return openPosition().and(futuresPosition.positionSide.eq(PositionSide.LONG));
    }

    // OPEN + SHORT 방향
    private BooleanExpression openShortPosition() {
        return openPosition().and(futuresPosition.positionSide.eq(PositionSide.SHORT));
    }

    // LONG 청산 트리거 — 청산가가 현재 가격 범위 최저가 이상일 때 (가격이 떨어져 청산가를 뚫음)
    private BooleanExpression longLiquidationTriggered(BigDecimal minPrice) {
        return minPrice != null ? futuresPosition.liquidationPrice.goe(minPrice) : null;
    }

    // SHORT 청산 트리거 — 청산가가 현재 가격 범위 최고가 이하일 때 (가격이 올라 청산가를 뚫음)
    private BooleanExpression shortLiquidationTriggered(BigDecimal maxPrice) {
        return maxPrice != null ? futuresPosition.liquidationPrice.loe(maxPrice) : null;
    }
}