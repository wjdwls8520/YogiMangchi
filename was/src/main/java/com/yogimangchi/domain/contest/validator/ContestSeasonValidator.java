package com.yogimangchi.domain.contest.validator;

import com.yogimangchi.domain.contest.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonUpdateDto;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 대회 시즌 생성/수정 시 기간 정책 검증기
 * 참가 신청 기간과 실제 대회 기간의 시작/종료 순서를 검증합니다.
 */
@Component
public class ContestSeasonValidator {

    public void validateCreateRequest(ContestCreateDto request) {
        validateDateRange(request.recruitmentStartAt(), request.recruitmentEndAt(), "대회 참가 신청 기간");
        validateDateRange(request.contestStartAt(), request.contestEndAt(), "대회 기간");
    }

    public void validateUpdateRequest(ContestSeasonUpdateDto request) {
        validateDateRange(request.recruitmentStartAt(), request.recruitmentEndAt(), "대회 참가 신청 기간");
        validateDateRange(request.contestStartAt(), request.contestEndAt(), "대회 기간");
    }

    private void validateDateRange(LocalDateTime startAt, LocalDateTime endAt, String label) {
        if (!startAt.isBefore(endAt)) {
            throw new IllegalArgumentException(label + "의 시작 일시는 종료 일시보다 빨라야 합니다.");
        }
    }
}
