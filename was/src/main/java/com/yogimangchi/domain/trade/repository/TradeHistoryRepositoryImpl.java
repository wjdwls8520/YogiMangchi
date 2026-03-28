package com.yogimangchi.domain.trade.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.trade.dto.request.TradeHistorySearchCondition;
import com.yogimangchi.domain.trade.entity.TradeHistory;
import com.yogimangchi.domain.trade.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

// Q클래스 static import
import static com.yogimangchi.domain.asset.entity.QAssets.assets;
import static com.yogimangchi.domain.trade.entity.QTradeHistory.tradeHistory;

@Repository
@RequiredArgsConstructor
public class TradeHistoryRepositoryImpl implements TradeHistoryRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<TradeHistory> searchTradeHistories(Long memberId, TradeHistorySearchCondition cond) {
        return queryFactory
                .selectFrom(tradeHistory)
                .join(tradeHistory.assets, assets) // 멤버 ID 검사와 지갑 타입 필터를 위해 지갑(Assets) 테이블 조인
                .where(
                        assets.member.id.eq(memberId),       //  내 지갑의 거래내역만 (필수)
                        assetTypeEq(cond.assetType()),       // 특정 지갑 타입 (MOCK 등) 필터 (필수)
                        cursorIdLt(cond.cursorId()),         // 커서 페이징 조건 (선택)
                        symbolEq(cond.symbol()),             // 심볼 필터 (선택)
                        sideEq(cond.side()),                 // 매수/매도 필터 (선택)
                        statusEq(cond.status()),             // 주문 상태 필터 (선택)
                        dateBetween(cond.startDate(), cond.endDate()) // 날짜 필터 (선택)
                )
                .orderBy(tradeHistory.id.desc())
                .limit(cond.getOrDefaultSize() + 1)          // 다음 페이지가 있는지 확인하기 위해 요청한 개수보다 1개 더 가져옴
                .fetch();
    }

    // =========================================================================
    //  아래 메서드들이 QueryDSL의 핵심 '동적 쿼리' 처리기입니다.
    // 파라미터 값이 null 이면 메서드도 null을 반환하고,
    // QueryDSL의 where() 안에서 null은 자동으로 무시(생략)됩니다!
    // =========================================================================

    private BooleanExpression assetTypeEq(AssetType assetType) {
        return assetType != null ? assets.type.eq(assetType) : null;
    }

    private BooleanExpression cursorIdLt(Long cursorId) {
        // 커서 ID가 없으면(null) 첫 페이지 조회이므로 조건 무시.
        // 커서 ID가 있으면, 그 ID보다 '작은(과거의)' 데이터만 찾음 (desc 정렬이므로)
        return cursorId != null ? tradeHistory.id.lt(cursorId) : null;
    }

    // 심볼(코인 이름) 검색 블록
    private BooleanExpression symbolEq(String symbol) {
        return StringUtils.hasText(symbol) ? tradeHistory.symbol.eq(symbol) : null;
    }

    // 매수/매도 검색 블록
    private BooleanExpression sideEq(String side) {
        return StringUtils.hasText(side) ? tradeHistory.side.eq(side) : null;
    }

    // 주문 상태 검색 블록
    private BooleanExpression statusEq(OrderStatus status) {
        return status != null ? tradeHistory.status.eq(status) : null;
    }

    private BooleanExpression dateBetween(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return null;
        }
        if (startDate != null && endDate == null) {
            return tradeHistory.createdAt.goe(startDate.atStartOfDay()); // 시작일 ~ 오늘
        }
        if (startDate == null && endDate != null) {
            return tradeHistory.createdAt.loe(endDate.atTime(LocalTime.MAX)); // 과거 ~ 종료일 밤 11:59:59
        }
        return tradeHistory.createdAt.between(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX));
    }
}