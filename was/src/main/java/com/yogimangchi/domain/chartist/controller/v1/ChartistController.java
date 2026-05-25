package com.yogimangchi.domain.chartist.controller.v1;

import com.yogimangchi.domain.chartist.dto.request.ChartistCursorSearchDto;
import com.yogimangchi.domain.chartist.dto.response.ChartistRankingDto;
import com.yogimangchi.domain.chartist.service.ChartistService;
import com.yogimangchi.global.dto.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chartist")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
@Tag(name = "99 - A0 - 차티스트", description = "차티스트 관련 api")
public class ChartistController {

    private final ChartistService chartistService;

    @Operation(
            summary = "대회 종료 후 참가자 순위 리스트 조회",
            description = "정산이 완료된 대회의 모든 참가자 순위 리스트를 커서 기반 무한 스크롤로 조회합니다. 순위, 닉네임, 실현손익, 수익률 정보를 포함하며 순위순으로 정렬되어 반환됩니다."
    )
    @GetMapping("/seasons/{seasonId}/results")
    public ResponseEntity<CursorResponseDto<ChartistRankingDto>> getChartistResults(
            @PathVariable("seasonId") Long seasonId,
            @Valid @ParameterObject @ModelAttribute ChartistCursorSearchDto request
    ) {
        CursorResponseDto<ChartistRankingDto> rankings = chartistService.getChartistRankings(seasonId, request);

        return ResponseEntity.ok(rankings);
    }
}
