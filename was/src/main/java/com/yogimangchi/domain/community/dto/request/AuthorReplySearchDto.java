package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "특정 유저 댓글 목록 검색 조건 / 무한 스크롤")
public record AuthorReplySearchDto(

        @Schema(description = "첫 요청은 비워두고, 다음 요청부터는 이전 응답의 nextCursorId 값을 넣어주세요.", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "한 번에 가져올 개수입니다. 비우면 기본값 5로 조회되고, 최대 10까지만 적용됩니다.", example = "5", defaultValue = "5", maximum = "10")
        Integer size
) {
}
