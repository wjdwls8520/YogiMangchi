package com.yogimangchi.domain.notification.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "알림 종류")
public enum NotificationType {
    // 모의투자 주문체결 vs 현물 주문체결 둘 중 어던 명칭으로 가야할지 정해야함
    @Schema(description = "주문 체결 알림")
    ORDER_COMPLETED,
    @Schema(description = "주문 취소 알림")
    ORDER_CANCELED
}
