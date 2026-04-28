package com.yogimangchi.domain.futures.controller;

import com.yogimangchi.domain.futures.dto.request.FuturesLeverageRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesLeverageResponseDto;
import com.yogimangchi.domain.futures.service.FuturesLeverageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/futures/contest")
@RequiredArgsConstructor
@Tag(name = "99-04-CONTEST FUTURES", description = "대회 선물 매매주문 관련 API")
public class ContestFuturesLeverageController {

    private final FuturesLeverageService futuresLeverageService;

    @Operation(
            summary = "대회 선물 레버리지 조회",
            description = "특정 대회 시즌 지갑의 심볼 레버리지를 조회합니다. 설정 이력이 없으면 기본값 1배를 반환합니다."
    )
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/{contestSeasonId}/leverage")
    public ResponseEntity<FuturesLeverageResponseDto> getLeverage(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId,
            @RequestParam @NotBlank String symbol
    ) {
        return ResponseEntity.ok(futuresLeverageService.getLeverage(memberId, contestSeasonId, symbol));
    }

    @Operation(
            summary = "대회 선물 레버리지 설정",
            description = """
                    특정 대회 시즌 지갑의 심볼별 레버리지를 설정합니다.

                    ⚠️ 주문 전 반드시 이 API를 호출하세요.
                    레버리지를 설정하지 않고 주문하면 기본값 1배로 처리됩니다.

                    - 설정값은 해당 심볼의 이후 모든 주문에 적용됩니다.
                    - OPEN 포지션이 있는 상태에서 레버리지 변경 시 증거금이 재계산되며 청산가도 즉시 갱신됩니다.
                    - 레버리지를 올릴 경우 새 청산가가 현재가에 너무 가까우면 변경이 거부됩니다.
                    """
    )
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @PutMapping("/{contestSeasonId}/leverage")
    public ResponseEntity<FuturesLeverageResponseDto> setLeverage(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId,
            @RequestBody @Valid FuturesLeverageRequestDto request
    ) {
        return ResponseEntity.ok(futuresLeverageService.setLeverage(memberId, contestSeasonId, request));
    }
}
