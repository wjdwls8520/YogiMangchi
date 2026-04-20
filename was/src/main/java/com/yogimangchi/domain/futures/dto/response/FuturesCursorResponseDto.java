package com.yogimangchi.domain.futures.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "선물 무한 스크롤 공통 응답")
public record FuturesCursorResponseDto<T>(

        @Schema(description = "실제 데이터 목록")
        List<T> content,

        @Schema(description = "다음 조회 커서 ID (마지막 항목의 ID, 더 이상 없으면 null)", example = "130")
        Long nextCursorId,

        @Schema(description = "다음 페이지 존재 여부", example = "true")
        boolean hasNext
) {}
