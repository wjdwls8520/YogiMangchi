package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantRejectDto;
import com.yogimangchi.domain.contest.dto.request.ContestApplicantSearchDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonStatusUpdateDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonUpdateDto;
import com.yogimangchi.domain.contest.dto.response.ContestApplicantDto;
import com.yogimangchi.domain.contest.dto.response.ContestParticipantDto;
import com.yogimangchi.domain.contest.dto.response.ContestRejectedApplicantDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.service.AdminContestService;
import com.yogimangchi.domain.futures.service.FuturesService;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.global.dto.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/contest")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "99 - A2 - Contest (admin)", description = "대회관련 api")
public class AdminContestController {

    private final AdminContestService adminContestService;

    @Operation(
            summary = "대회 생성 api",
            description = "대회를 생성함 제목, 내용, 기간 등을 세팅 할 수 있습니다"
    )
    @PostMapping("/seasons")
    public ResponseEntity<ContestSeasonDetailDto> createContest(
            @AuthenticationPrincipal Long adminId,
            @Valid @RequestBody ContestCreateDto request
    ) {
        ContestSeasonDetailDto contestSeasonDetail = adminContestService.createContest(adminId, request);

        return ResponseEntity.ok(contestSeasonDetail);
    }

    @Operation(
            summary = "대회 시즌 전체 수정",
            description = "대회 시즌의 제목, 설명, 참가 신청 기간, 실제 대회 기간을 모두 수정합니다. 상태값은 별도 api 로 수정합니다."
    )
    @PutMapping("/seasons/{seasonId}")
    public ResponseEntity<ContestSeasonDetailDto> updateContestSeason(
            @AuthenticationPrincipal Long adminId,
            @PathVariable("seasonId") Long seasonId,
            @Valid @RequestBody ContestSeasonUpdateDto request
    ) {
        ContestSeasonDetailDto contestSeasonDetail = adminContestService.updateContestSeason(adminId, seasonId, request);

        return ResponseEntity.ok(contestSeasonDetail);
    }

    @Operation(
            summary = "대회 시즌 상태 수정",
            description = "대회 시즌의 상태값만 수정합니다. 테스트나 운영 중 상태 전환이 필요할 때 사용합니다."
    )
    @PatchMapping("/seasons/{seasonId}/status")
    public ResponseEntity<ContestSeasonDetailDto> updateContestSeasonStatus(
            @AuthenticationPrincipal Long adminId,
            @PathVariable("seasonId") Long seasonId,
            @Valid @RequestBody ContestSeasonStatusUpdateDto request
    ) {
        ContestSeasonDetailDto contestSeasonDetail = adminContestService.updateContestSeasonStatus(adminId, seasonId, request);

        return ResponseEntity.ok(contestSeasonDetail);
    }

    @Operation(
            summary = "대회 신청 대기자 목록 조회",
            description = "특정 대회 시즌에서 아직 승인 또는 반려되지 않은 참가 신청 대기자 목록만 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/seasons/{seasonId}/applicants")
    public ResponseEntity<CursorResponseDto<ContestApplicantDto>> getContestApplicants(
            // 신청 대기자를 조회할 대회 시즌 ID 를 path 에서 받는다.
            @PathVariable("seasonId") Long seasonId,
            // 커서 기반 신청 대기자 조회 조건을 쿼리 파라미터로 받는다.
            @Valid @ParameterObject @ModelAttribute ContestApplicantSearchDto request
    ) {
        // 아직 처리되지 않은 신청 대기자 목록만 커서 방식으로 조회한다.
        CursorResponseDto<ContestApplicantDto> contestApplicants =
                adminContestService.getContestApplicants(seasonId, request);

        // 조회한 대기자 목록을 그대로 200 OK 로 반환한다.
        return ResponseEntity.ok(contestApplicants);
    }

    @Operation(
            summary = "대회 신청 승인",
            description = "특정 대회 시즌의 신청 대기자를 승인하고, 신청서는 제거한 뒤 대회 참가자 정보로 이동시킵니다. 모집중이거나 진행중인 시즌에서만 승인할 수 있습니다."
    )
    @PostMapping("/seasons/{seasonId}/applicants/{applicantId}/approve")
    public ResponseEntity<Void> approveContestApplicant(
            @AuthenticationPrincipal Long adminId,
            @PathVariable("seasonId") Long seasonId,
            // 승인할 신청서 ID 를 path 에서 받는다.
            @PathVariable("applicantId") Long applicantId
    ) {
        // 신청 대기자를 승인해 참가자 정보로 이동시킨다.
        adminContestService.approveContestApplicant(adminId, seasonId, applicantId);

        // 승인 처리가 끝났으므로 204 No Content 로 응답한다.
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "대회 신청 반려",
            description = "특정 대회 시즌의 신청 대기자를 반려하고, 신청서는 제거한 뒤 반려 사유와 함께 반려 이력으로 보관합니다. 모집중이거나 진행중인 시즌에서만 반려할 수 있습니다."
    )
    @PostMapping("/seasons/{seasonId}/applicants/{applicantId}/reject")
    public ResponseEntity<Void> rejectContestApplicant(
            @AuthenticationPrincipal Long adminId,
            @PathVariable("seasonId") Long seasonId,
            // 반려할 신청서 ID 를 path 에서 받는다.
            @PathVariable("applicantId") Long applicantId,
            // 반려 사유를 요청 본문에서 받는다.
            @Valid @RequestBody ContestApplicantRejectDto request
    ) {
        // 신청 대기자를 반려 이력으로 이동시키고 사유를 함께 보관한다.
        adminContestService.rejectContestApplicant(adminId, seasonId, applicantId, request);

        // 반려 처리가 끝났으므로 204 No Content 로 응답한다.
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "대회 참가자 목록 조회",
            description = "특정 대회 시즌에서 승인 완료된 참가자 목록을 커서 기반 무한 스크롤로 조회합니다. 신청자 정보와 승인 처리 관리자 정보까지 함께 조회합니다."
    )
    @GetMapping("/seasons/{seasonId}/participants")
    public ResponseEntity<CursorResponseDto<ContestParticipantDto>> getContestParticipants(
            // 참가자 목록을 조회할 대회 시즌 ID 를 path 에서 받는다.
            @PathVariable("seasonId") Long seasonId,
            // 커서 기반 참가자 조회 조건을 쿼리 파라미터로 받는다.
            @Valid @ParameterObject @ModelAttribute ContestApplicantSearchDto request
    ) {
        // 승인 완료된 참가자 목록을 커서 방식으로 조회한다.
        CursorResponseDto<ContestParticipantDto> contestParticipants =
                adminContestService.getContestParticipants(seasonId, request);

        // 조회한 참가자 목록을 그대로 200 OK 로 반환한다.
        return ResponseEntity.ok(contestParticipants);
    }

    @Operation(
            summary = "반려된 대회 신청 이력 조회",
            description = "특정 대회 시즌에서 반려된 신청 이력 목록을 커서 기반 무한 스크롤로 조회합니다. 신청자 정보와 반려 처리 관리자 정보까지 함께 조회합니다."
    )
    @GetMapping("/seasons/{seasonId}/rejected-applicants")
    public ResponseEntity<CursorResponseDto<ContestRejectedApplicantDto>> getRejectedContestApplicants(
            // 반려 이력을 조회할 대회 시즌 ID 를 path 에서 받는다.
            @PathVariable("seasonId") Long seasonId,
            // 커서 기반 반려 이력 조회 조건을 쿼리 파라미터로 받는다.
            @Valid @ParameterObject @ModelAttribute ContestApplicantSearchDto request
    ) {
        // 반려된 신청 이력 목록을 커서 방식으로 조회한다.
        CursorResponseDto<ContestRejectedApplicantDto> rejectedContestApplicants =
                adminContestService.getRejectedContestApplicants(seasonId, request);

        // 조회한 반려 이력 목록을 그대로 200 OK 로 반환한다.
        return ResponseEntity.ok(rejectedContestApplicants);
    }

    @Operation(
            summary = "역대 모든 대회 시즌 조회",
            description = "역대 모든 대회 시즌을 조회합니다."
    )
    @GetMapping("/seasons")
    public ResponseEntity<CursorResponseDto<ContestSeasonDetailDto>> getContestSeasons(@ParameterObject @ModelAttribute ContestSeasonSearchDto request ) {

        CursorResponseDto<ContestSeasonDetailDto> AllSeasons = adminContestService.getContestSeasons(request);

        return ResponseEntity.ok(AllSeasons);
    }
}
