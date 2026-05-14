package com.yogimangchi.domain.contest.participant.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 사용자 본인의 정산된 시즌 결과 응답 DTO
 *
 * <p>settledAt 이 채워진 시즌에 한해 반환된다. 미정산 시즌 호출 시
 * {@code CONTEST_SEASON_NOT_SETTLED} 예외로 분기되므로 본 DTO 의 박제 필드는 항상 not-null.</p>
 *
 * <p>박제값은 contest_participant 의 final_* 컬럼에서 단일 SELECT 로 가져온다. 실시간 계산이
 * 일어나지 않으므로 응답이 일관되고 빠르다.</p>
 */
@Schema(description = "내 대회 시즌 정산 결과 응답 DTO (정산 완료된 시즌만 반환)")
public record MyContestSeasonResultDto(

        @Schema(description = "대회 참가자 ID", example = "10")
        Long participantId,

        @Schema(description = "대회 시즌 ID", example = "3")
        Long seasonId,

        @Schema(description = "대회 시즌 제목", example = "4월 선물 대회")
        String seasonTitle,

        @Schema(description = "대회 [실제 시작] 일시")
        LocalDateTime contestStartAt,

        @Schema(description = "대회 [실제 종료] 일시")
        LocalDateTime contestEndAt,

        @Schema(description = "정산 완료 일시")
        LocalDateTime settledAt,

        @Schema(description = "정산 시점 실현 손익 합계 (USDT 또는 가상화폐 단위)", example = "1234.56789012")
        BigDecimal finalRealizedPnl,

        @Schema(description = "정산 시점 수익률 (%)", example = "12.3400")
        BigDecimal finalProfitRate,

        @Schema(description = "정산 시점 시즌 내 순위 (1부터 시작, RANK 방식)", example = "5")
        Integer finalRank
) {
}
