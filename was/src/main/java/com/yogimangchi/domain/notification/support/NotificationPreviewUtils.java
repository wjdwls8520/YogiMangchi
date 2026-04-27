package com.yogimangchi.domain.notification.support;

public final class NotificationPreviewUtils {

    private static final int POST_TITLE_PREVIEW_MAX_LENGTH = 40;
    private static final int REPLY_PREVIEW_MAX_LENGTH = 40;

    private NotificationPreviewUtils() {
    }

    public static String createPostTitlePreview(String title) {
        return createPreview(title, POST_TITLE_PREVIEW_MAX_LENGTH);
    }

    public static String createReplyContentPreview(String content) {
        return createPreview(content, REPLY_PREVIEW_MAX_LENGTH);
    }

    private static String createPreview(String source, int maxLength) {
        if (source == null || source.isBlank()) {
            return "";
        }

        // 알림 UI에서 한 줄로 자연스럽게 보이도록 줄바꿈과 연속 공백을 정리한다.
        String normalized = source.trim()
                .replace("\r", " ")
                .replace("\n", " ")
                .replaceAll("\\s+", " ");

        if (normalized.length() <= maxLength) {
            return normalized;
        }

        // 너무 긴 텍스트는 미리보기 길이까지만 잘라 알림 목록/상세에서 재사용한다.
        return normalized.substring(0, maxLength) + "...";
    }
}
