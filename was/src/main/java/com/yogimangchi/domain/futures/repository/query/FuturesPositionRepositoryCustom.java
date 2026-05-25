package com.yogimangchi.domain.futures.repository.query;

import com.yogimangchi.domain.futures.dto.query.FuturesOpenPositionSymbolCountDto;

import java.math.BigDecimal;
import java.util.List;

public interface FuturesPositionRepositoryCustom {

    // 강제청산 — 가격이 minPrice 까지 떨어졌을 때 청산되는 LONG OPEN 포지션 ID 조회
    // 조건: liquidationPrice >= minPrice (가격 하락 시 청산가 위로 잠겨드는 LONG 포지션)
    List<Long> findLongLiquidationCandidates(String symbol, BigDecimal minPrice, int size);

    // 강제청산 — 가격이 maxPrice 까지 올라갔을 때 청산되는 SHORT OPEN 포지션 ID 조회
    // 조건: liquidationPrice <= maxPrice (가격 상승 시 청산가 아래로 노출되는 SHORT 포지션)
    List<Long> findShortLiquidationCandidates(String symbol, BigDecimal maxPrice, int size);

    // 서버 기동 시 — 심볼별 OPEN 포지션 수 일괄 조회 (GROUP BY)
    // 강제청산 Registry 복원용
    List<FuturesOpenPositionSymbolCountDto> findOpenPositionCountsGroupBySymbol();

    // 대회 정산 스냅샷 캡처 단계 — 시즌 내 OPEN 포지션의 심볼 distinct 목록
    // 어느 심볼들의 가격을 박제해야 하는지 판단하기 위해 사용
    // 지갑 활성/만료 여부는 보지 않음 — 정산은 시즌의 모든 잔여 OPEN 포지션을 정리해야 하므로
    List<String> findDistinctOpenSymbolsByContestSeason(Long contestSeasonId);

    // 대회 정산 포지션 일괄 청산 단계 — 시즌 내 OPEN 포지션 ID 를 keyset 페이징으로 조회
    // OFFSET 페이징은 deep pagination 시 비효율 → ID 기반 cursor 로 처리
    //
    // 사용 패턴
    //   lastId 를 0L 부터 시작, 반환 결과의 마지막 ID 를 다음 호출의 lastId 로 사용
    //   빈 결과 = 모든 OPEN 포지션 처리 완료
    //
    // 정렬: id ASC — keyset 페이징 안전성 보장
    List<Long> findOpenPositionIdsByContestSeasonAfterId(Long contestSeasonId, Long lastId, int size);

    // 대회 정산 시 — 해당 시즌의 OPEN 포지션을 심볼별 카운트 (인메모리 차감용)
    List<FuturesOpenPositionSymbolCountDto> findOpenPositionCountsByContestSeason(Long contestSeasonId);

    // 회원탈퇴 시 — 해당 회원의 OPEN 포지션을 심볼별 카운트 (인메모리 차감용)
    List<FuturesOpenPositionSymbolCountDto> findOpenPositionCountsByMemberId(Long memberId);

    // 회원탈퇴 시 — 해당 회원의 OPEN 포지션 ID 목록을 keyset 페이징으로 조회
    List<Long> findOpenPositionIdsByMemberIdAfterId(Long memberId, Long lastId, int size);
}
