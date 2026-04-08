package com.yogimangchi.domain.contest.season.dto.response;

import com.yogimangchi.domain.contest.season.enums.ContestSeasonDisplayStatus;
import io.swagger.v3.oas.annotations.media.Schema;

public record ContestSeasonStatusResponseDto(

        @Schema(description = "대회 시즌 표시 상태 코드", example = "PUBLISHED")
        String code,

        @Schema(description = "대회 시즌 표시 상태 한글명", example = "공개중")
        String label
) {
    public static ContestSeasonStatusResponseDto from(ContestSeasonDisplayStatus status) {
        return new ContestSeasonStatusResponseDto(
                status.name(),
                status.getLabel()
        );
    }
}
