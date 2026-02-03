package com.yogimangchi.global.error;

import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

// @Getter, @Builder 다 필요 없음! (record가 알아서 함)
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String code,
        String message
) {

    // 정적 팩토리 메서드 (ResponseEntity 만들기 편하게)
    public static ResponseEntity<ErrorResponse> toResponseEntity(ErrorCode errorCode) {
        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(new ErrorResponse(
                        LocalDateTime.now(), // 여기서 시간 생성
                        errorCode.getHttpStatus().value(),
                        errorCode.getHttpStatus().name(),
                        errorCode.name(),
                        errorCode.getMessage()
                ));
    }
}