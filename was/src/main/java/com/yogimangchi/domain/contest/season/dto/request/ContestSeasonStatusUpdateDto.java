package com.yogimangchi.domain.contest.season.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "대회 시즌 상태 수정 요청 DTO")
public record ContestSeasonStatusUpdateDto(
        @Schema(description = "시즌 공개/비공개 유무", example = "true")
        @NotNull
        Boolean isPublic,

        @Schema(description = "시즌 취소 유무", example = "false")
        @NotNull
        Boolean isCancel
) {
}
