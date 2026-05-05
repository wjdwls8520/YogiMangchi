package com.yogimangchi.domain.notification.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "알림 종류")
public enum NotificationType {
    // 모의투자 주문체결 vs 현물 주문체결 둘 중 어던 명칭으로 가야할지 정해야함
    @Schema(description = "주문 체결 알림")
    ORDER_COMPLETED,

    @Schema(description = "주문 취소 알림")
    ORDER_CANCELED,

    @Schema(description = "강제 청산 알림")
    LIQUIDATION_COMPLETED,

    @Schema(description = "게시글 댓글 생성 알림")
    POST_COMMENT_CREATED,

    @Schema(description = "댓글 답글 생성 알림")
    REPLY_COMMENT_CREATED,

    @Schema(description = "게시글 좋아요 알림")
    POST_LIKED,

    @Schema(description = "댓글 좋아요 알림")
    REPLY_LIKED,

    @Schema(description = "팔로우 생성 알림")
    FOLLOW_CREATED
}
