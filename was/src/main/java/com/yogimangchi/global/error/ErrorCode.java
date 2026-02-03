package com.yogimangchi.global.error;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // 1. 공통 에러 (Common)
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부에 문제가 생겼습니다. 잠시 후 다시 시도해주세요."),
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다. (JS 조작 의심)"),

    // 2. 인증/권한 에러 (Auth)
    UNAUTHORIZED_USER(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    FORBIDDEN_USER(HttpStatus.FORBIDDEN, "권한이 없는 요청입니다."),

    // 3. 한투 API 관련 에러 (External)
    KIS_API_ERROR(HttpStatus.BAD_GATEWAY, "한국투자증권 서버와 통신 중 오류가 발생했습니다."),

    // 4. 주식/도메인 에러 (Domain)
    STOCK_NOT_FOUND(HttpStatus.NOT_FOUND, "해당 종목을 찾을 수 없습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}