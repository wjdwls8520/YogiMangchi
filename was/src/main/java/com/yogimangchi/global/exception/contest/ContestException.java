package com.yogimangchi.global.exception.contest;

import org.springframework.http.HttpStatus;

public class ContestException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    private ContestException(HttpStatus status, String code, String message) {
        super(message); // RuntimeException의 java errorMessage에 상속
        this.status = status;
        this.code = code;
    }

    public static ContestException duplicateApplication() {
        return new ContestException(
                HttpStatus.CONFLICT,
                "CONTEST_APPLICATION_CONFLICT",
                "이미 신청한 대회 시즌입니다."
        );
    }

    public static ContestException contestSeasonNotFound() {
        return new ContestException(
                HttpStatus.NOT_FOUND,
                "CONTEST_SEASON_NOT_FOUND",
                "존재하지 않는 대회 시즌입니다."
        );
    }

    public static ContestException contestSeasonNotApplicable() {
        return new ContestException(
                HttpStatus.CONFLICT,
                "CONTEST_SEASON_NOT_APPLICABLE",
                "대회 참가 신청 가능 기간이 아닙니다."
        );
    }

    public static ContestException contestSeasonNotApprovable() {
        return new ContestException(
                HttpStatus.CONFLICT,
                "CONTEST_SEASON_NOT_APPROVABLE",
                "대회 신청 승인 가능 기간이 아닙니다."
        );
    }

    public static ContestException contestSeasonNotApplicableStatus() {
        return new ContestException(
                HttpStatus.CONFLICT,
                "CONTEST_SEASON_NOT_APPLICABLE_STATUS",
                "공개 중이 아니거나 취소된 대회 시즌에는 참가 신청을 할 수 없습니다."
        );
    }

    public static ContestException contestSeasonNotApprovableStatus() {
        return new ContestException(
                HttpStatus.CONFLICT,
                "CONTEST_SEASON_NOT_APPROVABLE_STATUS",
                "공개 중이 아니거나 취소된 대회 시즌에는 신청 승인 처리를 할 수 없습니다."
        );
    }

    public static ContestException invalidContestSeasonPeriod(String message) {
        return new ContestException(
                HttpStatus.BAD_REQUEST,
                "CONTEST_SEASON_INVALID_PERIOD",
                message
        );
    }

    public static ContestException contestApplicantNotFound() {
        return new ContestException(
                HttpStatus.NOT_FOUND,
                "CONTEST_APPLICANT_NOT_FOUND",
                "존재하지 않는 대회 신청자입니다."
        );
    }

    public static ContestException alreadyParticipating() {
        return new ContestException(
                HttpStatus.CONFLICT,
                "CONTEST_ALREADY_PARTICIPATING",
                "이미 참가 중인 대회입니다."
        );
    }

    // 정산 가격 스냅샷 캡처 실패 — 인메모리 ticker 캐시에 일부 심볼의 가격이 없을 때
    // 어드민이 잠시 후 재시도하도록 유도 (WebSocket 재연결 또는 첫 틱 수신 대기)
    public static ContestException settlementSnapshotPriceUnavailable(java.util.List<String> missingSymbols) {
        return new ContestException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "CONTEST_SETTLEMENT_PRICE_UNAVAILABLE",
                "정산 기준가를 가져올 수 없는 심볼이 있습니다. 잠시 후 다시 시도해 주세요. (missing: " + missingSymbols + ")"
        );
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
