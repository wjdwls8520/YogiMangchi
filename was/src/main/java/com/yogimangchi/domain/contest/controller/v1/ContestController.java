package com.yogimangchi.domain.contest.controller.v1;

import com.yogimangchi.domain.contest.dto.response.ContestSeasonDetailDto;
import com.yogimangchi.domain.contest.service.ContestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/contest")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
@Tag(name = "99 - A1 - Contest", description = "대회관련 api")
public class ContestController {

    private final ContestService contestService;

    @Operation(
            summary = "최신 대회 정보 가져오기",
            description = "인증회원 또는 관리자만 최신 대회 정보를 가져올 수 있습니다.."
    )
    @GetMapping("/season/latest")
    public ResponseEntity<ContestSeasonDetailDto> getLatestContestSeason() {
        ContestSeasonDetailDto contestSeasonByLatest = contestService.getLatestContestSeason();
        return ResponseEntity.ok(contestSeasonByLatest);
    }
}
