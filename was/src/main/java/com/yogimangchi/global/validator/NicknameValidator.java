package com.yogimangchi.global.validator;

import java.util.regex.Pattern;

public final class NicknameValidator {

    public static final String REQUIRED_MESSAGE = "닉네임은 필수입니다.";
    public static final String INVALID_FORMAT_MESSAGE = "닉네임은 공백없는 한글, 영문, 숫자만 사용 가능하며 2~12자여야 합니다.";

    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[가-힣a-zA-Z0-9]{2,12}$");

    private NicknameValidator() {
    }

    public static void validate(String nickname) {
        if (nickname == null || nickname.isBlank()) {
            throw new IllegalArgumentException(REQUIRED_MESSAGE);
        }

        if (!NICKNAME_PATTERN.matcher(nickname).matches()) {
            throw new IllegalArgumentException(INVALID_FORMAT_MESSAGE);
        }
    }
}
