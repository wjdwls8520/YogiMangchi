package com.yogimangchi.domain.report.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record ReportResponseDto(
        @Schema(description = "신고 대상 ID", example = "12")
        Long targetId,

        @Schema(description = "신고 수", example = "3")
        Long reportCount,

        @Schema(description = "로그인한 사용자의 신고 여부", example = "true")
        Boolean reportedByMe
) {}
