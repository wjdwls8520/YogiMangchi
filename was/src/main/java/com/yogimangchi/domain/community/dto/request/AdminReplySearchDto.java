package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "어드민 커뮤니티 댓글 검색 조건")
public record AdminReplySearchDto(
        @Schema(description = "부모 게시글 제목 검색어", example = "비트코인", nullable = true)
        String postTitle,

        @Schema(description = "부모 게시글 내용 검색어", example = "전망", nullable = true)
        String postContent,

        @Schema(description = "댓글 내용 검색어", example = "동의합니다", nullable = true)
        String replyContent,

        @Schema(description = "댓글 작성자 닉네임 검색어", example = "홍길동", nullable = true)
        String authorNickname,

        @Schema(description = "첫 요청은 null, 이후 이전 페이지 nextCursorId", example = "500", nullable = true)
        Long cursorId,

        @Schema(description = "페이지 크기 (기본 10, 최대 50)", example = "10", defaultValue = "10")
        Integer size
) {
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : Math.min(size, 50);
    }
}
