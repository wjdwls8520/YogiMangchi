package com.yogimangchi.domain.futures.controller;

import com.yogimangchi.domain.futures.dto.response.ContestFuturesWalletStatusResponseDto;
import com.yogimangchi.domain.futures.service.FuturesQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/futures/contest")
@RequiredArgsConstructor
@Tag(name = "99-04-CONTEST FUTURES", description = "대회 선물 매매주문 관련 API")
public class ContestFuturesAssetController {

    private final FuturesQueryService futuresQueryService;

    @Operation(summary = "대회 선물 계좌 상태 조회",
            description = "특정 대회 시즌의 선물 계좌 상태를 조회합니다. 잔고, 시드머니, 사용 중인 증거금(마진), 계좌 상태, 만료일을 반환합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/{contestSeasonId}/wallet/status")
    public ResponseEntity<ContestFuturesWalletStatusResponseDto> getContestWalletStatus(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId
    ) {
        return ResponseEntity.ok(futuresQueryService.getContestWalletStatus(memberId, contestSeasonId));
    }
}
