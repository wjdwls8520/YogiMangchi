package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.dto.request.ContestCreateDto;
import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.service.AdminContestService;
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
            @Valid @ParameterObject @RequestBody ContestCreateDto request
    ) {
        ContestSeasonDetailDto ContestSeasonDetail = adminContestService.createContest(adminId, request);

        return ResponseEntity.ok(ContestSeasonDetail);
    }
}
