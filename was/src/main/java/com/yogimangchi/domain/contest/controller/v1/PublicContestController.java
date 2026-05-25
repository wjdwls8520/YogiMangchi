package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.season.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.season.dto.response.ContestSeasonPublicDto;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/contest/public")
@RequiredArgsConstructor
@Tag(name = "99 - A0 - Contest ( 로그인안한 유저 용 조회 )", description = "비로그인 유저용 대회 조회 API")
public class PublicContestController {

    private final PublicContestService publicContestService;

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
}
