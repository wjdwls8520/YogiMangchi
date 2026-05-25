package com.yogimangchi.domain.contest.season.dto.response;

import com.yogimangchi.domain.contest.season.entity.ContestSeason;
import com.yogimangchi.domain.contest.season.enums.ContestSeasonDisplayStatus;
import com.yogimangchi.domain.contest.season.support.ContestSeasonDisplayInfo;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "비로그인 유저용 대회 시즌 응답 DTO")
public record ContestSeasonPublicDto(
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

        @Schema(description = "현재 모집중 여부", example = "true")
        Boolean isRecruiting,

        @Schema(description = "현재 라이브 진행중 여부", example = "false")
        Boolean isLive,

        @Schema(description = "대회 종료 여부", example = "true")
        Boolean isFinished,

        @Schema(description = "현재 표시 상태", example = "PUBLISHED")
        ContestSeasonDisplayStatus displayStatus
) {
    public static ContestSeasonPublicDto from(ContestSeason contestSeason, LocalDateTime now) {
        ContestSeasonDisplayInfo displayInfo = ContestSeasonDisplayInfo.from(contestSeason, now);
        boolean isFinished = now.isAfter(contestSeason.getContestEndAt());

        return new ContestSeasonPublicDto(
                contestSeason.getId(),
                contestSeason.getTitle(),
                contestSeason.getDescription(),
                contestSeason.getRecruitmentStartAt(),
                contestSeason.getRecruitmentEndAt(),
                contestSeason.getContestStartAt(),
                contestSeason.getContestEndAt(),
                displayInfo.isRecruiting(),
                displayInfo.isLive(),
                isFinished,
                displayInfo.displayStatus()
        );
    }
}
