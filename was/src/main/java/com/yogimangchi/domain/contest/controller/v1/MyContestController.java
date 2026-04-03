package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.dto.response.ContestParticipationSeasonDto;
import com.yogimangchi.domain.contest.dto.response.MyContestPendingApplicationDto;
import com.yogimangchi.domain.contest.dto.response.MyContestLatestRejectedApplicationDto;
import com.yogimangchi.domain.contest.service.ContestService;
import com.yogimangchi.global.dto.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/contest")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
@Tag(name = "99 - A1 - Contest (me)", description = "내 대회 관련 api")
public class MyContestController {

    private final ContestService contestService;

    @Operation(
            summary = "내 모든 대회 미승인 참가 신청서 조회",
            description = "로그인한 회원의 아직 승인/반려되지 않은 대회 참가 신청 목록을 커서 기반 무한 스크롤로 조회합니다. 정렬과 커서는 대회 신청 ID 기준이며, 첫 요청은 cursorId 없이 보내고 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/pending-applications")
    public ResponseEntity<CursorResponseDto<MyContestPendingApplicationDto>> getMyPendingContestApplications(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @ParameterObject @ModelAttribute ContestCursorSearchDto request
    ) {
        CursorResponseDto<MyContestPendingApplicationDto> pendingApplications =
                contestService.getMyPendingContestApplications(loginMemberId, request);

        return ResponseEntity.ok(pendingApplications);
    }

    @Operation(
            summary = "내 모든 참가 중인 대회 조회",
            description = "로그인한 회원이 현재 참가 중인 대회 목록을 커서 기반 무한 스크롤로 조회합니다. 모집중이거나 진행중인 시즌(RECRUITING, LIVE)만 조회되며, 정렬과 커서는 대회 참가자 ID 기준입니다. 첫 요청은 cursorId 없이 보내고 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/participating-seasons")
    public ResponseEntity<CursorResponseDto<ContestParticipationSeasonDto>> getMyParticipatingContestSeasons(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @ParameterObject @ModelAttribute ContestCursorSearchDto request
    ) {
        CursorResponseDto<ContestParticipationSeasonDto> participationSeasons =
                contestService.getMyParticipatingContestSeasons(loginMemberId, request);

        return ResponseEntity.ok(participationSeasons);
    }

    @Operation(
            summary = "내 최근 반려된 대회 신청 이력 조회",
            description = "알림함이나 메시지함 기능이 생기기 전까지 사용하는 예비 조회 api 입니다. 로그인한 회원의 가장 최근 반려된 대회 신청 이력 1건을 조회합니다."
    )
    @GetMapping("/rejected-applications/latest")
    public ResponseEntity<MyContestLatestRejectedApplicationDto> getMyLatestRejectedContestApplication(
            @AuthenticationPrincipal Long loginMemberId
    ) {
        MyContestLatestRejectedApplicationDto latestRejectedApplication =
                contestService.getMyLatestRejectedContestApplication(loginMemberId);

        if (latestRejectedApplication == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(latestRejectedApplication);
    }
}
