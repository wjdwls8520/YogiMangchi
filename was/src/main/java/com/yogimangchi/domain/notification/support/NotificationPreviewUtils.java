package com.yogimangchi.domain.notification.support;

public final class NotificationPreviewUtils {

    private static final int REPLY_PREVIEW_MAX_LENGTH = 40;

    private NotificationPreviewUtils() {
    }

    public static String createReplyContentPreview(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }

        // 알림 UI에서 한 줄로 자연스럽게 보이도록 줄바꿈과 연속 공백을 정리한다.
        String normalized = content.trim()
                .replace("\r", " ")
                .replace("\n", " ")
                .replaceAll("\\s+", " ");

        if (normalized.length() <= REPLY_PREVIEW_MAX_LENGTH) {
            return normalized;
        }

        // 너무 긴 본문은 미리보기 길이까지만 잘라 알림 목록/상세에서 재사용한다.
        return normalized.substring(0, REPLY_PREVIEW_MAX_LENGTH) + "...";
    }
}
