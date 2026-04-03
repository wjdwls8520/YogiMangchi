package com.yogimangchi.domain.contest.dto.request;

import com.yogimangchi.domain.contest.enums.ContestApplicantStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "대회 신청자 상태 수정 요청 DTO")
public record ContestApplicantStatusUpdateDto(
        @Schema(description = "변경할 대회 신청 상태", example = "APPROVED")
        @NotNull
        ContestApplicantStatus status
) {
}
