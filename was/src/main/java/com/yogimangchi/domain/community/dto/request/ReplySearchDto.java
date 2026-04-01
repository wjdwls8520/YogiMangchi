package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "댓글 목록 검색 조건 / 무한 스크롤")
public record ReplySearchDto(

        @Schema(description = "첫 요청은 비워두고, 다음 요청부터는 이전 응답의 nextCursorId 값을 넣어주세요.", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "parentId를 보내지 않으면 최상위 댓글, 값이 있다면 대댓글", nullable = true)
        Long parentId,

        @Schema(description = "한 번에 가져올 개수입니다. 비우면 기본값 5로 조회되고, 최대 10까지만 적용됩니다.", example = "5", defaultValue = "5", maximum = "10")
        Integer size
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 5 : Math.min(size, 10);
    }
}
