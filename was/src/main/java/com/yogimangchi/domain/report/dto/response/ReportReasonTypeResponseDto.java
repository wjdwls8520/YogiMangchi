package com.yogimangchi.domain.report.dto.response;

import com.yogimangchi.domain.report.enums.ReportReasonType;
import io.swagger.v3.oas.annotations.media.Schema;

public record ReportReasonTypeResponseDto(
        @Schema(description = "신고 사유 코드", example = "SPAM")
        String code,

        @Schema(description = "신고 사유 한글명", example = "스팸·광고")
        String label
) {
    public static ReportReasonTypeResponseDto from(ReportReasonType type) {
        return new ReportReasonTypeResponseDto(type.name(), type.getLabel());
    }
}
