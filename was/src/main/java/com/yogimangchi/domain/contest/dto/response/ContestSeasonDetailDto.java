package com.yogimangchi.domain.contest.dto.response;

import com.yogimangchi.domain.contest.entity.ContestSeason;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

// 대회 시즌 생성/상세 조회 후 클라이언트에 내려줄 응답 DTO
public record ContestSeasonDetailDto(

        @Schema(description = "대회 시즌 ID", example = "1")
        Long id,

        @Schema(description = "대회 시즌 제목", example = "4월 선물 대회")
        String title,

        @Schema(description = "대회 시즌 설명", example = "매달 진행되는 선물 트레이딩 대회입니다.")
        String description,

        @Schema(description = "대회 [참가 신청] 시작 일시")
        LocalDateTime recruitmentStartAt,

        @Schema(description = "대회 [참가 신청] 종료 일시")
        LocalDateTime recruitmentEndAt,

        @Schema(description = "대회 [실제 시작] 일시")
        LocalDateTime contestStartAt,

        @Schema(description = "대회 [실제 종료] 일시")
        LocalDateTime contestEndAt,

        @Schema(description = "대회 [시즌 생성] 일시")
        LocalDateTime createdAt,

        @Schema(description = "대회 [시즌 수정] 일시")
        LocalDateTime updatedAt,

        @Schema(description = "대회 시즌 상태")
        ContestSeasonStatusResponseDto status
) {
    public static ContestSeasonDetailDto from(ContestSeason contestSeason) {
        return new ContestSeasonDetailDto(
                contestSeason.getId(),
                contestSeason.getTitle(),
                contestSeason.getDescription(),
                contestSeason.getRecruitmentStartAt(),
                contestSeason.getRecruitmentEndAt(),
                contestSeason.getContestStartAt(),
                contestSeason.getContestEndAt(),
                contestSeason.getCreatedAt(),
                contestSeason.getUpdatedAt(),
                ContestSeasonStatusResponseDto.from(contestSeason.getStatus())
        );
    }
}
