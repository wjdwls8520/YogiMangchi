package com.yogimangchi.domain.contest.dto.response;

import com.yogimangchi.domain.contest.entity.ContestApplicant;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record ContestApplicantDto(
        @Schema(description = "대회 신청 ID", example = "10")
        Long applicantId,

        @Schema(description = "신청 회원 ID", example = "101")
        Long memberId,

        @Schema(description = "신청 회원 닉네임", example = "망치길동")
        String nickname,

        @Schema(description = "신청 회원 프로필 이미지 URL", example = "https://example.com/profile.png", nullable = true)
        String profileImgUrl,

        @Schema(description = "대회 신청 생성 일시")
        LocalDateTime createdAt,

        @Schema(description = "대회 신청 수정 일시")
        LocalDateTime updatedAt,

        @Schema(description = "대회 신청 상태")
        ContestApplicantStatusResponseDto status
) {
    public static ContestApplicantDto from(ContestApplicant contestApplicant) {
        return new ContestApplicantDto(
                contestApplicant.getId(),
                contestApplicant.getMember().getId(),
                contestApplicant.getMember().getNickname(),
                contestApplicant.getMember().getProfileImgUrl(),
                contestApplicant.getCreatedAt(),
                contestApplicant.getUpdatedAt(),
                ContestApplicantStatusResponseDto.from(contestApplicant.getStatus())
        );
    }
}
