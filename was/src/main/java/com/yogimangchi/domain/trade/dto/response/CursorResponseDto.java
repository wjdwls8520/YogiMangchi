package com.yogimangchi.domain.trade.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "무한 스크롤 공통 응답 DTO")
public record CursorResponseDto<T>(

        @Schema(description = "실제 데이터 목록")
        List<T> content,

        @Schema(description = "다음 조회 커서 (더 이상 없으면 null)", example = "130")
        Long nextCursorId,

        @Schema(description = "다음 페이지 존재 여부", example = "true")
        boolean hasNext
) {}