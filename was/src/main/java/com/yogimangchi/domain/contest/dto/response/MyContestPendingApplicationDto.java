package com.yogimangchi.domain.contest.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "내 미체결 대회 참가 신청 목록 응답 DTO")
public record MyContestPendingApplicationDto(
        @Schema(description = "대회 신청 ID", example = "10")
        Long applicantId,

        @Schema(description = "최초 참가 신청 일시")
        LocalDateTime appliedAt,

        @Schema(description = "대회 시즌 ID", example = "3")
        Long seasonId,

        @Schema(description = "대회 시즌 제목", example = "4월 선물 대회")
        String seasonTitle,

        @Schema(description = "대회 시즌 설명", example = "매달 진행되는 선물 트레이딩 대회입니다.")
        String seasonDescription,

        @Schema(description = "대회 [참가 신청] 시작 일시")
        LocalDateTime recruitmentStartAt,

        @Schema(description = "대회 [참가 신청] 종료 일시")
        LocalDateTime recruitmentEndAt,

        @Schema(description = "대회 [실제 시작] 일시")
        LocalDateTime contestStartAt,

        @Schema(description = "대회 [실제 종료] 일시")
        LocalDateTime contestEndAt,

        @Schema(description = "대회 [시즌 생성] 일시")
        LocalDateTime seasonCreatedAt,

        @Schema(description = "대회 [시즌 수정] 일시")
        LocalDateTime seasonUpdatedAt,

        @Schema(description = "대회 시즌 현재 상태")
        ContestSeasonStatusResponseDto seasonStatus
) {
}
