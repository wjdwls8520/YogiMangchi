package com.yogimangchi.domain.notification.dto.request;

import com.yogimangchi.domain.notification.enums.NotificationScope;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;

@Schema(description = "알림 목록 조회 조건")
public record NotificationSearchConditionDto(

        @Positive(message = "cursorId는 0보다 커야 합니다.")
        @Schema(description = "첫 요청은 비워두고, 다음 요청부터는 이전 응답의 nextCursorId 값을 넣어주세요.", example = "120", nullable = true)
        Long cursorId,

        @Positive(message = "size는 0보다 커야 합니다.")
        @Max(value = 50, message = "size는 최대 50까지 요청할 수 있습니다.")
        @Schema(description = "한 번에 가져올 알림 개수입니다. 기본값은 10, 최대값은 50입니다.", example = "10", defaultValue = "10")
        Integer size,

        @Schema(description = "알림 조회 범위입니다. TODAY는 오늘 받은 알림만, ALL은 전체 알림을 조회합니다.", example = "ALL", nullable = true)
        NotificationScope scope,

        @Schema(description = "읽음 여부 필터입니다. true면 읽은 알림만, false면 읽지 않은 알림만 조회합니다.", example = "false", nullable = true)
        Boolean read
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null ? 10 : Math.min(size, 50);
    }
}
