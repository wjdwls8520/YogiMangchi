package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.common.dto.request.ContestCursorSearchDto;
import com.yogimangchi.domain.contest.participant.dto.response.ContestRankingDto;
import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.season.dto.response.ContestSeasonPublicDto;
import com.yogimangchi.domain.contest.service.ContestService;
import com.yogimangchi.domain.contest.service.PublicContestService;
import com.yogimangchi.global.dto.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/contest/public")
@RequiredArgsConstructor
@Tag(name = "99 - A0 - Contest ( 로그인안한 유저 용 조회 )", description = "비로그인 유저용 대회 조회 API")
public class PublicContestController {

    private final PublicContestService publicContestService;
    private final ContestService contestService;

    @Operation(
            summary = "참가 신청 중인 모든 대회 조회",
            description = "참가 신청 기간이며, 공개 상태이고, 취소되지 않은 모든 대회 시즌 목록을 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/recruiting")
    public ResponseEntity<CursorResponseDto<ContestSeasonPublicDto>> getRecruitingContestSeasons(
            @Valid @ParameterObject @ModelAttribute ContestSeasonSearchDto request
    ) {
        CursorResponseDto<ContestSeasonPublicDto> result = publicContestService.getRecruitingContestSeasons(request);
        return ResponseEntity.ok(result);
    }

    @Operation(
            summary = "진행 중인 모든 대회 조회",
            description = "실제 대회 진행 기간이며, 공개 상태이고, 취소되지 않은 모든 대회 시즌 목록을 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/running")
    public ResponseEntity<CursorResponseDto<ContestSeasonPublicDto>> getRunningContestSeasons(
            @Valid @ParameterObject @ModelAttribute ContestSeasonSearchDto request
    ) {
        CursorResponseDto<ContestSeasonPublicDto> result = publicContestService.getRunningContestSeasons(request);
        return ResponseEntity.ok(result);
    }

    @Operation(
            summary = "종료된 모든 대회 조회",
            description = "실제 대회 진행 기간이 만료되었으며, 공개 상태이고, 취소되지 않은 모든 대회 시즌 목록을 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/finished")
    public ResponseEntity<CursorResponseDto<ContestSeasonPublicDto>> getFinishedContestSeasons(
            @Valid @ParameterObject @ModelAttribute ContestSeasonSearchDto request
    ) {
        CursorResponseDto<ContestSeasonPublicDto> result = publicContestService.getFinishedContestSeasons(request);
        return ResponseEntity.ok(result);
    }

    // [비로그인 전용 복사본] /rank 페이지용: 셀렉트박스로 선택한 특정 시즌 대회의 순위 결과를 비로그인 사용자도 조회할 수 있도록 ContestController에서 복사하여 제공
    @Operation(
            summary = "비로그인 전용 특정 대회 순위 리스트 조회 (/rank 페이지용)",
            description = "정산이 완료된 특정 대회의 모든 참가자 순위 리스트를 비로그인 사용자도 커서 기반 무한 스크롤로 조회할 수 있습니다."
    )
    @GetMapping("/seasons/{seasonId}/results")
    public ResponseEntity<CursorResponseDto<ContestRankingDto>> getContestResults(
            @PathVariable("seasonId") Long seasonId,
            @Valid @ParameterObject @ModelAttribute ContestCursorSearchDto request
    ) {
        CursorResponseDto<ContestRankingDto> rankings = contestService.getContestRankings(seasonId, request);
        return ResponseEntity.ok(rankings);
    }

    // [비로그인 전용 복사본] /community/all 및 /community/all/{id} 우측 사이드바용: 최근 종료된 대회의 순위 결과(TOP 5)를 비로그인 사용자도 시즌 ID 없이 즉시 조회할 수 있도록 제공
    @Operation(
            summary = "비로그인 전용 최근 종료된 대회의 순위 리스트 조회 (/community 사이드바 TOP 5용)",
            description = "가장 최근에 종료된 대회의 참가자 순위 리스트를 비로그인 사용자도 즉시 조회할 수 있습니다."
    )
    @GetMapping("/seasons/latest-finished/results")
    public ResponseEntity<CursorResponseDto<ContestRankingDto>> getLatestFinishedContestResults(
            @Valid @ParameterObject @ModelAttribute ContestCursorSearchDto request
    ) {
        CursorResponseDto<ContestRankingDto> rankings = publicContestService.getLatestFinishedContestRankings(request);
        return ResponseEntity.ok(rankings);
    }
}
