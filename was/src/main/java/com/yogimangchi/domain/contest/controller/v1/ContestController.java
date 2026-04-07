package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.dto.response.ContestParticipationSeasonDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonStatusResponseDto;
import com.yogimangchi.domain.contest.service.ContestService;
import com.yogimangchi.global.dto.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contest")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
@Tag(name = "99 - A1 - Contest", description = "대회관련 api")
public class ContestController {

    private final ContestService contestService;

    @Operation(
            summary = "대회 시즌 상태 목록 조회",
            description = "대회 조회 화면이나 상태 셀렉트 박스에서 사용할 대회 시즌 상태 코드와 라벨 목록을 조회합니다. [ 셀렉박스용 ]"
    )
    @GetMapping("/seasons/statuses")
    public ResponseEntity<List<ContestSeasonStatusResponseDto>> getContestSeasonStatuses() {
        List<ContestSeasonStatusResponseDto> contestSeasonStatuses = contestService.getContestSeasonStatuses();

        return ResponseEntity.ok(contestSeasonStatuses);
    }

    @Operation(
            summary = "참가 신청 가능 대회 시즌 목록 조회",
            description = "현재 참가 신청이 가능한 대회 시즌 목록을 커서 기반 무한 스크롤로 조회합니다. 모집중이거나 진행중인 시즌이 조회 대상입니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/seasons/recruiting")
    public ResponseEntity<CursorResponseDto<ContestSeasonDetailDto>> getApplicableContestSeasons(
            // 현재 로그인한 회원 ID 를 인증 정보에서 꺼낸다.
            @AuthenticationPrincipal Long loginMemberId,
            // 커서 기반 조회 조건을 쿼리 파라미터로 받는다.
            @Valid @ParameterObject @ModelAttribute ContestSeasonSearchDto request
    ) {
        // 참가 신청 가능한 대회 시즌 목록을 커서 방식으로 조회한다.
        CursorResponseDto<ContestSeasonDetailDto> applicableContestSeasons =
                contestService.getApplicableContestSeasons(loginMemberId, request);

        // 조회한 목록을 그대로 200 OK 로 반환한다.
        return ResponseEntity.ok(applicableContestSeasons);
    }

    @Operation(
            summary = "특정 유저의 모든 참가 이력 + 참가 중 대회 조회",
            description = "특정 유저의 참가중이거나 이미 참가 완료한 대회 목록을 커서 기반 무한 스크롤로 조회합니다. 모집중, 진행중, 종료된 시즌(RECRUITING, LIVE, FINISHED)만 조회되며 정렬과 커서는 대회 참가자 ID 기준입니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/member/{memberId}/participation-seasons")
    public ResponseEntity<CursorResponseDto<ContestParticipationSeasonDto>> getMemberContestParticipationSeasons(
            // 조회 대상 회원 ID 를 path 에서 받는다.
            @PathVariable("memberId") Long memberId,
            // 커서 기반 조회 조건을 쿼리 파라미터로 받는다.
            @Valid @ParameterObject @ModelAttribute ContestCursorSearchDto request
    ) {
        // 특정 회원의 참가중 + 참가 완료 대회 목록을 커서 방식으로 조회한다.
        CursorResponseDto<ContestParticipationSeasonDto> participationSeasons =
                contestService.getMemberContestParticipationSeasons(memberId, request);

        // 조회한 목록을 그대로 200 OK 로 반환한다.
        return ResponseEntity.ok(participationSeasons);
    }

    @Operation(
            summary = "대회 참가 신청",
            description = "path 의 seasonId 에 참가 신청할 대회 시즌 ID를 넣어주세요. 모집중이거나 진행중인 대회 시즌에만 신청할 수 있고, 같은 시즌에는 중복 신청할 수 없습니다."
    )
    @PostMapping("/seasons/{seasonId}/applications")
    public ResponseEntity<Void> applyContestSeason(
            // 현재 로그인한 회원 ID 를 인증 정보에서 꺼낸다.
            @AuthenticationPrincipal Long loginMemberId,
            // 참가 신청할 대회 시즌 ID 를 path 에서 받는다.
            @PathVariable("seasonId") Long seasonId
    ) {
        // 로그인한 회원이 해당 시즌에 참가 신청하도록 처리한다.
        contestService.applyContestSeason(loginMemberId, seasonId);

        // 신청이 생성되었으므로 201 Created 로 응답한다.
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
