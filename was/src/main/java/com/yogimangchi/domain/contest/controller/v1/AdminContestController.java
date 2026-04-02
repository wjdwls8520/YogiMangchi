package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.dto.request.ContestSeasonSearchDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.service.AdminContestService;
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
        ContestSeasonDetailDto ContestSeasonDetail = adminContestService.createContest(adminId, request);

        return ResponseEntity.ok(ContestSeasonDetail);
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
