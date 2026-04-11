package com.yogimangchi.global.exception.notification;

import org.springframework.http.HttpStatus;

public class NotificationException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private NotificationException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    private NotificationException(HttpStatus status, String code, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
        this.code = code;
    }

    public static NotificationException notificationNotFound() {
        return new NotificationException(
                HttpStatus.NOT_FOUND,
                "NOTIFICATION_NOT_FOUND",
                "알림을 찾을 수 없습니다."
        );
    }

    public static NotificationException notificationResponseCreationFailed() {
        return new NotificationException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "NOTIFICATION_RESPONSE_CREATE_FAILED",
                "알림 응답 생성에 실패했습니다."
        );
    }

    public static NotificationException notificationPayloadSerializationFailed(Throwable cause) {
        return new NotificationException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "NOTIFICATION_PAYLOAD_SERIALIZATION_FAILED",
                "알림 payload 직렬화에 실패했습니다.",
                cause
        );
    }

    public static NotificationException notificationSubscribeFailed(Throwable cause) {
        return new NotificationException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "NOTIFICATION_SUBSCRIBE_FAILED",
                "알림 구독 연결에 실패했습니다.",
                cause
        );
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
