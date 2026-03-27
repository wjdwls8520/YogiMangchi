package com.yogimangchi.global.validator;

import java.util.regex.Pattern;

/**
 * 닉네임 형식 검증 유틸리티 (글로벌 공용)
 * 닉네임이 "공백 없는 한글/영문/숫자, 2~12자" 규칙을 만족하는지 검사합니다.
 *
 * 예시: NicknameValidator.validate("망치길동")  → 통과
 *       NicknameValidator.validate("a")         → IllegalArgumentException (2자 미만)
 */
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
