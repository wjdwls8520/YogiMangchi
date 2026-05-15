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

    @Operation(summary = "정산 완료/종료된 대회 선물 계좌 상태 조회 (사후 조회)",
            description = """
                    정산이 완료되었거나 종료된 대회 시즌의 본인 선물 지갑 상태를 사후 조회합니다.

                    기존 /wallet/status 는 활성 가드(ACTIVE + contestEndAt >= now)가 있어 정산 후엔 조회 불가.
                    본 엔드포인트는 상태/시각 필터 없이 (본인, 시즌) 매칭만으로 지갑을 반환하므로
                    프론트의 "대회 종료 후 결과 화면" 에서 사용 가능합니다.

                    정산 후엔 OPEN 포지션이 0건이라 marginInUse=0 이 정상이며, status 필드로 INACTIVE 여부를 확인할 수 있습니다.
                    수익금/순위 정보는 GET /api/v1/me/contest/seasons/{seasonId}/result 와 함께 사용하세요.
                    """)
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/{contestSeasonId}/wallet/status/finished")
    public ResponseEntity<ContestFuturesWalletStatusResponseDto> getFinishedContestWalletStatus(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId
    ) {
        return ResponseEntity.ok(futuresQueryService.getFinishedContestWalletStatus(memberId, contestSeasonId));
    }
}
