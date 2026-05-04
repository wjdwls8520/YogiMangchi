package com.yogimangchi.global.exception.market;

import org.springframework.http.HttpStatus;

public class MarketException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private MarketException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static MarketException symbolNotFound() {
        return new MarketException(
                HttpStatus.NOT_FOUND,
                "MARKET_SYMBOL_NOT_FOUND",
                "존재하지 않는 마켓 심볼입니다."
        );
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
}
