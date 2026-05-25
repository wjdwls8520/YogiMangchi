package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "어드민 커뮤니티 게시글 검색 조건")
public record AdminPostSearchDto(
        @Schema(description = "게시글 제목 검색어", example = "비트코인", nullable = true)
        String title,

        @Schema(description = "게시글 내용 검색어", example = "전망", nullable = true)
        String content,

        @Schema(description = "작성자 닉네임 검색어", example = "홍길동", nullable = true)
        String authorNickname,

        @Schema(description = "첫 요청은 null, 이후 이전 페이지 nextCursorId", example = "100", nullable = true)
        Long cursorId,

        @Schema(description = "페이지 크기 (기본 10, 최대 50)", example = "10", defaultValue = "10")
        Integer size
) {
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : Math.min(size, 50);
    }
}
