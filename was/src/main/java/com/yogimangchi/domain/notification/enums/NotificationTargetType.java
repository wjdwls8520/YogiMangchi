package com.yogimangchi.domain.notification.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "알림 중복 방지 대상 리소스 종류")
public enum NotificationTargetType {
    @Schema(description = "게시글")
    POST,

    @Schema(description = "댓글")
    REPLY,

    @Schema(description = "회원")
    MEMBER
}
