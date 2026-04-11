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

    public static AssetException tradableContestFuturesWalletNotFound() {
        return new AssetException(
                HttpStatus.NOT_FOUND,
                "TRADABLE_CONTEST_FUTURES_WALLET_NOT_FOUND",
                "거래 가능한 대회 선물 지갑이 없습니다."
        );
    }

    public static AssetException tradableRealFuturesWalletNotFound() {
        return new AssetException(
                HttpStatus.NOT_FOUND,
                "TRADABLE_REAL_FUTURES_WALLET_NOT_FOUND",
                "거래 가능한 본투자 선물 지갑이 없습니다."
        );
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
