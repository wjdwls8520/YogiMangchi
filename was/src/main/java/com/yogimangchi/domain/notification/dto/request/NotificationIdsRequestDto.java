package com.yogimangchi.domain.notification.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

@Schema(description = "알림 ID 목록 요청")
public record NotificationIdsRequestDto(
        @NotEmpty(message = "알림 ID 목록은 비어 있을 수 없습니다.")
        @Schema(description = "처리할 알림 ID 목록", example = "[10, 9, 8]")
        List<
                @NotNull(message = "알림 ID는 null일 수 없습니다.")
                @Positive(message = "알림 ID는 0보다 커야 합니다.")
                Long> notificationIds
) {
}
