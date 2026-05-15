package com.yogimangchi.domain.contest.season.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

// 대회 시즌 정산(강제종료) 결과 응답 DTO
// 어드민 페이지에서 "지갑 1,234개 비활성화 / 포지션 567건 청산 / 참가자 1,234명 박제 완료" 형태로 즉시 노출하기 위한 요약 정보
public record ContestSettlementResultDto(

        @Schema(description = "정산된 대회 시즌 ID", example = "1")
        Long seasonId,

        @Schema(description = "대회 시즌 제목", example = "4월 선물 대회")
        String seasonTitle,

        @Schema(description = "정산 처리 완료 일시")
        LocalDateTime settledAt,

        @Schema(description = "비활성화 처리된 대회 지갑 수", example = "1234")
        int deactivatedWalletCount,

        @Schema(description = "강제청산 처리된 OPEN 포지션 수", example = "567")
        int liquidatedPositionCount,

        @Schema(description = "정산 대상 참가자 수", example = "1234")
        int participantCount,

        @Schema(description = "최종 결과(수익금/수익률/순위)가 확정되어 저장된 참가자 수", example = "1234")
        int finalizedParticipantCount,

        @Schema(description = "이미 정산된 시즌에 다시 호출됐는지 여부 (true면 이번 호출에서 실제 변경 없음)", example = "false")
        boolean alreadySettled
) {
    // 신규 정산 완료 — 실제로 지갑/포지션/참가자 박제가 처리된 경우
    public static ContestSettlementResultDto of(
            Long seasonId,
            String seasonTitle,
            LocalDateTime settledAt,
            int deactivatedWalletCount,
            int liquidatedPositionCount,
            int participantCount,
            int finalizedParticipantCount
    ) {
        return new ContestSettlementResultDto(
                seasonId,
                seasonTitle,
                settledAt,
                deactivatedWalletCount,
                liquidatedPositionCount,
                participantCount,
                finalizedParticipantCount,
                false
        );
    }

    // 멱등 호출 — 이미 정산된 시즌에 다시 요청이 들어왔을 때 기존 정산 결과 그대로 반환
    public static ContestSettlementResultDto alreadySettled(
            Long seasonId,
            String seasonTitle,
            LocalDateTime settledAt,
            int participantCount
    ) {
        return new ContestSettlementResultDto(
                seasonId,
                seasonTitle,
                settledAt,
                0,
                0,
                participantCount,
                0,
                true
        );
    }
}
