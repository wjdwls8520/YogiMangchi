package com.yogimangchi.domain.contest.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record ContestParticipantDto(
        @Schema(description = "대회 참가자 ID", example = "10")
        Long participantId,

        @Schema(description = "대회 참가 회원 ID", example = "101")
        Long memberId,

        @Schema(description = "대회 참가 회원 닉네임", example = "망치길동")
        String nickname,

        @Schema(description = "대회 참가 회원 프로필 이미지 URL", example = "https://example.com/profile.png", nullable = true)
        String profileImgUrl,

        @Schema(description = "최초 참가 신청 일시")
        LocalDateTime appliedAt,

        @Schema(description = "참가 승인 일시")
        LocalDateTime approvedAt,

        @Schema(description = "참가 승인 처리 관리자 회원 ID", example = "1")
        Long approvedByAdminId,

        @Schema(description = "참가 승인 처리 관리자 닉네임", example = "운영자")
        String approvedByAdminNickname,

        @Schema(description = "참가 승인 처리 관리자 프로필 이미지 URL", example = "https://example.com/admin.png", nullable = true)
        String approvedByAdminProfileImgUrl
) {
}
