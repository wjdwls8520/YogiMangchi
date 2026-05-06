package com.yogimangchi.domain.real.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.asset.entity.QAssets;
import com.yogimangchi.domain.real.dto.request.TransferHistorySearchCondition;
import com.yogimangchi.domain.real.entity.TransferHistory;
import com.yogimangchi.domain.real.enums.TransferType;
import lombok.RequiredArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static com.yogimangchi.domain.asset.entity.QAssets.assets;
import static com.yogimangchi.domain.real.entity.QTransferHistory.transferHistory;

@RequiredArgsConstructor
public class TransferHistoryRepositoryImpl implements TransferHistoryRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<TransferHistory> findTransferHistories(Long memberId, TransferHistorySearchCondition condition) {
        // N+1 문제 방지를 위해 fromAsset, toAsset을 fetchJoin 처리합니다.

        // 1. 조인을 위한 두 개의 독립적인 Alias 생성
        QAssets fromAssetAlias = new QAssets("fromAssetAlias");
        QAssets toAssetAlias = new QAssets("toAssetAlias");
        return queryFactory
                .selectFrom(transferHistory)
                // 2. 각각 만든 Alias를 사용하여 조인
                .join(transferHistory.fromAsset, fromAssetAlias).fetchJoin()
                .join(transferHistory.toAsset, toAssetAlias).fetchJoin()
                .where(
                        transferHistory.member.id.eq(memberId), // 현재 사용자의 내역만 조회
                        lessThanCursorId(condition.cursorId()), // 커서 기반 No-Offset 조건
                        eqTransferType(condition.transferType()), // 이체 유형 필터 (선택)
                        dateBetween(condition.startDate(), condition.endDate()) // 날짜 범위 필터 (선택)
                )
                .orderBy(transferHistory.id.desc()) // 최신순 정렬
                .limit(condition.getOrDefaultSize() + 1) // 다음 페이지 여부 확인을 위해 +1개 조회
                .fetch();
    }

    // 커서 ID 조건: 전달된 cursorId보다 작은(과거의) ID만 조회
    private BooleanExpression lessThanCursorId(Long cursorId) {
        if (cursorId == null) {
            return null; // 첫 조회 시에는 조건 없음
        }
        return transferHistory.id.lt(cursorId);
    }

    // 이체 유형 필터 조건: 전달된 이체 유형과 일치하는 내역만 조회
    private BooleanExpression eqTransferType(TransferType transferType) {
        if (transferType == null) {
            return null;
        }
        return transferHistory.transferType.eq(transferType);
    }

    // 조회 기간 필터 조건: spot 패키지의 컨벤션(LocalDate)과 동일하게 적용
    private BooleanExpression dateBetween(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return null;
        }
        if (startDate != null && endDate == null) {
            return transferHistory.createdAt.goe(startDate.atStartOfDay()); // 시작일 00:00:00 이후
        }
        if (startDate == null && endDate != null) {
            return transferHistory.createdAt.loe(endDate.atTime(LocalTime.MAX)); // 종료일 23:59:59 이전
        }
        // 시작일 00:00:00 ~ 종료일 23:59:59 사이
        return transferHistory.createdAt.between(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX));
    }
}
