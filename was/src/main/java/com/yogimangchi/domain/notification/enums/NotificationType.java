package com.yogimangchi.domain.notification.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "알림 종류")
public enum NotificationType {
    @Schema(description = "주문 체결 알림")
    ORDER_COMPLETED,
    @Schema(description = "주문 취소 알림")
    ORDER_CANCELED
}
