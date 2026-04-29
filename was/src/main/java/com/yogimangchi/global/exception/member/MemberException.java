package com.yogimangchi.global.exception.member;

import org.springframework.http.HttpStatus;

public class MemberException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private MemberException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public static MemberException alreadyVerified() {
        return new MemberException(
                HttpStatus.CONFLICT,
                "MEMBER_ALREADY_VERIFIED",
                "이미 인증된 회원입니다."
        );
    }

    public static MemberException invalidVerificationCode() {
        return new MemberException(
                HttpStatus.BAD_REQUEST,
                "MEMBER_INVALID_VERIFICATION_CODE",
                "인증 코드가 올바르지 않거나 만료되었습니다."
        );
    }

    public static MemberException emailSendFailed() {
        return new MemberException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "MEMBER_EMAIL_SEND_FAILED",
                "이메일 발송에 실패했습니다."
        );
    }

    public static MemberException emailNotVerified() {
        return new MemberException(
                HttpStatus.BAD_REQUEST,
                "MEMBER_EMAIL_NOT_VERIFIED",
                "이메일 인증을 먼저 완료해주세요."
        );
    }

    public static MemberException emailMismatch() {
        return new MemberException(
                HttpStatus.BAD_REQUEST,
                "MEMBER_EMAIL_MISMATCH",
                "소셜 로그인에 사용된 이메일로만 인증할 수 있습니다."
        );
    }

    public static MemberException oauthAccountNotFound() {
        return new MemberException(
                HttpStatus.NOT_FOUND,
                "MEMBER_OAUTH_ACCOUNT_NOT_FOUND",
                "소셜 계정 정보를 찾을 수 없습니다."
        );
    }

    public static MemberException memberNotFound() {
        return new MemberException(
                HttpStatus.NOT_FOUND,
                "MEMBER_NOT_FOUND",
                "존재하지 않거나 탈퇴한 회원입니다."
        );
    }

    public static MemberException notVerifiedUser() {
        return new MemberException(
                HttpStatus.FORBIDDEN,
                "MEMBER_NOT_VERIFIED",
                "인증회원만 사용할 수 있는 기능입니다."
        );
    }

    public static MemberException emailResendTooSoon() {
        return new MemberException(
                HttpStatus.TOO_MANY_REQUESTS,
                "MEMBER_EMAIL_RESEND_TOO_SOON",
                "인증 코드를 요청한 지 1분이 지나지 않았습니다. 잠시 후 다시 시도해주세요."
        );
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }

}
