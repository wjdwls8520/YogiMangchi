package com.yogimangchi.global.sse.enums;

public enum CommunitySseEventType {
    // 게시글 작성자에게 새 댓글 알림을 보낼 때
    NOTIFICATION_COMMUNITY_POST_COMMENT_CREATED,

    // 댓글 작성자에게 새 답글 알림을 보낼 때
    NOTIFICATION_COMMUNITY_REPLY_COMMENT_CREATED,

    // 게시글 좋아요 알림
    NOTIFICATION_COMMUNITY_POST_LIKED,

    // 댓글 좋아요 알림
    NOTIFICATION_COMMUNITY_REPLY_LIKED,

    // 팔로우 알림 전송
    NOTIFICATION_COMMUNITY_FOLLOW_CREATED
}
