package com.yogimangchi.domain.contest.dto.response;

import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import io.swagger.v3.oas.annotations.media.Schema;

public record ContestSeasonStatusResponseDto(

        @Schema(description = "대회 시즌 상태 코드", example = "RECRUITING")
        String code,

        @Schema(description = "대회 시즌 상태 한글명", example = "모집중")
        String label
) {
    public static ContestSeasonStatusResponseDto from(ContestSeasonStatus status) {
        return new ContestSeasonStatusResponseDto(
                status.name(),
                status.getLabel()
        );
    }
}
