package com.yogimangchi.domain.community.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "게시글 목록 응답 DTO")
public record PageSizeKeywordDto(
        @Schema(description = "페이지", example = "3")
        Integer page,
        @Schema(description = "보여질 콘텐츠 수", example = "5")
        Integer size,
        @Schema(description = "검색 키워드", example = "비트")
        String keyword
) {}
