package com.yogimangchi.global.error;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // 1. 우리가 직접 터뜨린 에러 (비즈니스 로직)
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException e) {
        log.warn("CustomException 발생: {}", e.getErrorCode().getMessage()); // 경고 로그
        return ErrorResponse.toResponseEntity(e.getErrorCode());
    }

    // 2. 예상치 못한 모든 시스템 에러 (NullPointer, DB 연결 끊김 등)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllException(Exception e) {
        // 서버 로그에는 아주 상세하게 남김 (범인 색출용)
        log.error("예상치 못한 서버 에러 발생: ", e);

        // 유저에게는 "서버 에러입니다"라고만 예쁘게 말함 (보안)
        return ErrorResponse.toResponseEntity(ErrorCode.INTERNAL_SERVER_ERROR);
    }
}