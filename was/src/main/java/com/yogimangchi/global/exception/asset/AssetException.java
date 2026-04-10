package com.yogimangchi.global.exception.asset;

import org.springframework.http.HttpStatus;

public class AssetException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private AssetException(HttpStatus status, String code, String message) {
        super(message); // RuntimeException의 java errorMessage에 상속
        this.status = status;
        this.code = code;
    }

    public static AssetException walletAlreadyExists() {
        return new AssetException(
                HttpStatus.CONFLICT,
                "WALLET_ALREADY_EXISTS",
                "이미 생성된 지갑입니다."
        );
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
