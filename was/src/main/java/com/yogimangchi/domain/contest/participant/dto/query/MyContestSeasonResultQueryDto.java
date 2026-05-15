package com.yogimangchi.domain.contest.participant.dto.query;

import com.yogimangchi.domain.contest.participant.dto.response.MyContestSeasonResultDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 사용자 본인 시즌 결과 단일 조회용 Query 운반체.
 *
 * <p>참가자 + 시즌 + 박제 결과를 1 회 SELECT 로 묶어서 응답한다. settledAt 은 NULL 이 올 수 있어
 * 서비스 단에서 분기 처리한다 — settledAt NULL 이면 박제 컬럼 3 개도 모두 NULL 이므로 응답 DTO 로
 * 변환하기 전 분기 가드가 필수.</p>
 */
public record MyContestSeasonResultQueryDto(
        Long participantId,
        Long seasonId,
        String seasonTitle,
        LocalDateTime contestStartAt,
        LocalDateTime contestEndAt,
        LocalDateTime settledAt,
        BigDecimal finalRealizedPnl,
        BigDecimal finalProfitRate,
        Integer finalRank
) {
    // 정산 완료된 시즌에 한해 호출. settledAt 분기는 호출자(서비스)가 사전에 검증한다.
    public MyContestSeasonResultDto toResponseDto() {
        return new MyContestSeasonResultDto(
                participantId,
                seasonId,
                seasonTitle,
                contestStartAt,
                contestEndAt,
                settledAt,
                finalRealizedPnl,
                finalProfitRate,
                finalRank
        );
    }
}
