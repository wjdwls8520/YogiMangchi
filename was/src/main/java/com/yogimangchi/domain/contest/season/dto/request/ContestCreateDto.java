package com.yogimangchi.domain.contest.season.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Schema(description = "대회 시즌 생성 요청 DTO")
public record ContestCreateDto(
        @Schema(description = "대회 시즌 제목", example = "2026년 4월 선물 트레이딩 대회")
        @NotBlank
        String title,

        @Schema(description = "대회 시즌 설명", example = "매달 열리는 선물 대회입니다.")
        @NotBlank
        String description,

        @Schema(description = "대회 참가 신청 시작 일시 input[type=datetime-local] ", example = "2026-04-01T00:00:00")
        @NotNull
        LocalDateTime recruitmentStartAt,

        @Schema(description = "대회 참가 신청 종료 일시", example = "2026-04-04T23:59:59")
        @NotNull
        LocalDateTime recruitmentEndAt,

        @Schema(description = "대회 실제 시작 일시", example = "2026-04-05T00:00:00")
        @NotNull
        LocalDateTime contestStartAt,

        @Schema(description = "대회 실제 종료 일시", example = "2026-04-19T23:59:59")
        @NotNull
        LocalDateTime contestEndAt
) {}
