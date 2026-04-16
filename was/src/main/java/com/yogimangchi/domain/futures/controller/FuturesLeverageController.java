package com.yogimangchi.domain.futures.controller;

import com.yogimangchi.domain.futures.dto.request.FuturesLeverageRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesLeverageResponseDto;
import com.yogimangchi.domain.futures.service.FuturesLeverageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/v1/futures")
@RequiredArgsConstructor
@Tag(name = "99-04-futures", description = "선물 매매주문 관련 API")
public class FuturesLeverageController {

    private final FuturesLeverageService futuresLeverageService;

    @Operation(
            summary = "본투자 선물 레버리지 조회",
            description = "본투자 선물 지갑의 특정 심볼 레버리지를 조회합니다. 설정 이력이 없으면 기본값 1배를 반환합니다."
    )
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/leverage")
    public ResponseEntity<FuturesLeverageResponseDto> getRealLeverage(
            @AuthenticationPrincipal Long memberId,
            @RequestParam @NotBlank String symbol
    ) {
        FuturesLeverageResponseDto response = futuresLeverageService.getLeverage(memberId, null, symbol);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "대회 선물 레버리지 조회",
            description = "특정 대회 시즌 지갑의 심볼 레버리지를 조회합니다. 설정 이력이 없으면 기본값 1배를 반환합니다."
    )
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/contest/{contestSeasonId}/leverage")
    public ResponseEntity<FuturesLeverageResponseDto> getContestLeverage(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId,
            @RequestParam @NotBlank String symbol
    ) {
        FuturesLeverageResponseDto response = futuresLeverageService.getLeverage(memberId, contestSeasonId, symbol);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "본투자 선물 레버리지 설정",
            description = "본투자 선물 지갑의 심볼별 레버리지를 설정합니다. 설정값은 이후 해당 심볼 주문에 적용됩니다."
    )
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @PutMapping("/leverage")
    public ResponseEntity<FuturesLeverageResponseDto> setRealLeverage(
            @AuthenticationPrincipal Long memberId,
            @RequestBody @Valid FuturesLeverageRequestDto request
    ) {
        FuturesLeverageResponseDto response = futuresLeverageService.setLeverage(memberId, null, request);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "대회 선물 레버리지 설정",
            description = "특정 대회 시즌 지갑의 심볼별 레버리지를 설정합니다. 설정값은 이후 해당 심볼 주문에 적용됩니다."
    )
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @PutMapping("/contest/{contestSeasonId}/leverage")
    public ResponseEntity<FuturesLeverageResponseDto> setContestLeverage(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId,
            @RequestBody @Valid FuturesLeverageRequestDto request
    ) {
        FuturesLeverageResponseDto response = futuresLeverageService.setLeverage(memberId, contestSeasonId, request);
        return ResponseEntity.ok(response);
    }
}
