package com.yogimangchi.domain.contest.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

public record ContestSeasonSearchDto(
        @Schema(description = "첫 요청은 비워두고, 다음 요청부터는 이전 응답의 nextCursorId 값을 넣어주세요.", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "한 번에 가져올 개수입니다. 비우면 기본값 10으로 조회되고, 최대 10까지만 적용됩니다.", example = "10", defaultValue = "10", maximum = "10")
        Integer size
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : Math.min(size, 10);
    }
}
