package com.yogimangchi.domain.contest.dto.request;

import com.yogimangchi.domain.contest.enums.ContestSeasonStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "대회 시즌 상태 수정 요청 DTO")
public record ContestSeasonStatusUpdateDto(
        @Schema(description = "변경할 대회 시즌 상태", example = "RECRUITING")
        @NotNull
        ContestSeasonStatus status
) {
}
