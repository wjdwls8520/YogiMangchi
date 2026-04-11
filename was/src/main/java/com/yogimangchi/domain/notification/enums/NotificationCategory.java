package com.yogimangchi.domain.notification.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "알림 카테고리")
public enum NotificationCategory {
    MOCK,
    TRADE,
    CONTEST,
    COMMUNITY,
    FOLLOW,
    REPORT
}
