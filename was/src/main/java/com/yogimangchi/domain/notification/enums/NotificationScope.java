package com.yogimangchi.domain.notification.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "알림 조회 범위")
public enum NotificationScope {
    TODAY,
    ALL
}
