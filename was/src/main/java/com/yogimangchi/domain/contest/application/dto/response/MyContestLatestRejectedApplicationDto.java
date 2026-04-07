package com.yogimangchi.domain.contest.application.dto.response;

import com.yogimangchi.domain.contest.season.enums.ContestSeasonDisplayStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "내 최근 반려된 대회 신청 이력 응답 DTO")
public record MyContestLatestRejectedApplicationDto(
        @Schema(description = "반려 이력 ID", example = "10")
        Long rejectedApplicantId,

        @Schema(description = "대회 시즌 ID", example = "3")
        Long seasonId,

        @Schema(description = "대회 시즌 제목", example = "4월 선물 대회")
        String seasonTitle,

        @Schema(description = "대회 시즌 설명", example = "매달 진행되는 선물 트레이딩 대회입니다.")
        String seasonDescription,

        @Schema(description = "현재 모집중 여부", example = "true")
        Boolean isRecruiting,

        @Schema(description = "현재 라이브 진행중 여부", example = "false")
        Boolean isLive,

        @Schema(description = "현재 표시 상태", example = "PUBLISHED")
        ContestSeasonDisplayStatus displayStatus,

        @Schema(description = "최초 참가 신청 일시")
        LocalDateTime appliedAt,

        @Schema(description = "반려 처리 일시")
        LocalDateTime rejectedAt,

        @Schema(description = "반려 사유")
        String rejectReason,

        @Schema(description = "반려 처리 관리자 회원 ID", example = "1")
        Long rejectedByAdminId,

        @Schema(description = "반려 처리 관리자 닉네임", example = "운영자")
        String rejectedByAdminNickname,

        @Schema(description = "반려 처리 관리자 프로필 이미지 URL", example = "https://example.com/admin.png", nullable = true)
        String rejectedByAdminProfileImgUrl
) {
}
