package com.yogimangchi.domain.contest.dto.response;

import com.yogimangchi.domain.contest.enums.ContestApplicantStatus;
import io.swagger.v3.oas.annotations.media.Schema;

public record ContestApplicantStatusResponseDto(

        @Schema(description = "대회 신청 상태 코드", example = "PENDING")
        String code,

        @Schema(description = "대회 신청 상태 한글명", example = "승인 대기")
        String label
) {
    public static ContestApplicantStatusResponseDto from(ContestApplicantStatus status) {
        return new ContestApplicantStatusResponseDto(
                status.name(),
                status.getLabel()
        );
    }
}
