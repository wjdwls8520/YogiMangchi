package com.yogimangchi.domain.real.dto.request;

import com.yogimangchi.domain.real.enums.TransferType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDate;

@Schema(description = "이체 내역 검색 조건")
public record TransferHistorySearchCondition(
        @Schema(description = "마지막으로 조회한 내역 ID(커서 ID)", example = "100", nullable = true)
        Long cursorId,

        @Min(value = 1, message = "최소 1개 이상 조회해야 합니다.")
        @Max(value = 100, message = "한 번에 최대 100개까지만 조회할 수 있습니다.")
        @Schema(description = "한 번에 가져올 개수(기본값 10, 최대 100)", example = "10", defaultValue = "10")
        Integer size,

        @Schema(description = "이체 유형 필터(SPOT_TO_FUTURE, FUTURE_TO_SPOT)", example = "SPOT_TO_FUTURE", nullable = true)
        TransferType transferType,

        @Schema(description = "조회 시작일", example = "2026-05-01", nullable = true)
        LocalDate startDate,

        @Schema(description = "조회 종료일", example = "2026-05-06", nullable = true)
        LocalDate endDate
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : size;
    }
}
