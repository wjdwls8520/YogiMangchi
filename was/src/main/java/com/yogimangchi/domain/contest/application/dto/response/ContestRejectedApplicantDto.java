package com.yogimangchi.domain.contest.application.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record ContestRejectedApplicantDto(
        @Schema(description = "반려 이력 ID", example = "10")
        Long rejectedApplicantId,

        @Schema(description = "반려된 신청 회원 ID", example = "101")
        Long memberId,

        @Schema(description = "반려된 신청 회원 닉네임", example = "망치길동")
        String nickname,

        @Schema(description = "반려된 신청 회원 프로필 이미지 URL", example = "https://example.com/profile.png", nullable = true)
        String profileImgUrl,

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
