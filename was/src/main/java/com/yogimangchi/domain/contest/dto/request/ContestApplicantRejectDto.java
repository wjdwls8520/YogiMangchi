package com.yogimangchi.domain.contest.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "대회 신청 반려 요청 DTO")
public record ContestApplicantRejectDto(
        @Schema(description = "대회 신청 반려 사유", example = "닉네임 변경 이력이 확인되지 않아 수동 확인이 필요합니다.")
        @NotBlank(message = "반려 사유는 필수입니다.")
        @Size(max = 255, message = "반려 사유는 255자 이하로 입력해주세요.")
        String rejectReason
) {
}
