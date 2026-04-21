package com.yogimangchi.domain.futures.controller;

import com.yogimangchi.domain.futures.dto.request.FuturesClosedPositionSearchConditionDto;
import com.yogimangchi.domain.futures.dto.request.FuturesMarketOrderCloseRequestDto;
import com.yogimangchi.domain.futures.dto.request.FuturesMarketOrderOpenRequestDto;
import com.yogimangchi.domain.futures.dto.request.FuturesOrderSearchConditionDto;
import com.yogimangchi.domain.futures.dto.response.FuturesCursorResponseDto;
import com.yogimangchi.domain.futures.dto.response.FuturesMarketOrderResponseDto;
import com.yogimangchi.domain.futures.dto.response.FuturesOrderResponseDto;
import com.yogimangchi.domain.futures.dto.response.FuturesPositionResponseDto;
import com.yogimangchi.domain.futures.service.FuturesOrderService;
import com.yogimangchi.domain.futures.service.FuturesQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/futures/contest")
@RequiredArgsConstructor
@Tag(name = "99-04-CONTEST FUTURES", description = "대회 선물 매매주문 관련 API")
public class ContestFuturesOrderController {

    private final FuturesOrderService futuresOrderService;
    private final FuturesQueryService futuresQueryService;

    @Operation(summary = "대회 선물 시장가 진입 주문",
            description = "특정 대회 시즌 지갑으로 시장가 진입 주문합니다. 롱(매수)/숏(매도) 방향을 리퀘스트바디에 담아주세요.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @PostMapping("/{contestSeasonId}/order/market/open")
    public ResponseEntity<FuturesMarketOrderResponseDto> placeMarketOrderOpen(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId,
            @RequestBody @Valid FuturesMarketOrderOpenRequestDto request
    ) {
        return ResponseEntity.ok(futuresOrderService.placeFuturesMarketOrderOpen(memberId, contestSeasonId, request));
    }

    @Operation(summary = "대회 선물 시장가 청산 주문",
            description = "특정 대회 시즌 지갑에서 보유 포지션을 시장가로 청산합니다. 부분 청산 가능합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @PostMapping("/{contestSeasonId}/order/market/close")
    public ResponseEntity<FuturesMarketOrderResponseDto> placeMarketOrderClose(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId,
            @RequestBody @Valid FuturesMarketOrderCloseRequestDto request
    ) {
        return ResponseEntity.ok(futuresOrderService.placeFuturesMarketOrderClose(memberId, contestSeasonId, request));
    }

    @Operation(summary = "대회 선물 주문 내역 조회",
            description = "특정 대회 시즌 지갑의 주문 내역을 커서 방식 무한스크롤로 조회합니다. 체결/미체결 통합 조회이며 orderStatus 필터로 구분 가능합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/{contestSeasonId}/orders")
    public ResponseEntity<FuturesCursorResponseDto<FuturesOrderResponseDto>> getOrders(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId,
            @ParameterObject @ModelAttribute FuturesOrderSearchConditionDto condition
    ) {
        return ResponseEntity.ok(futuresQueryService.getOrders(memberId, contestSeasonId, condition));
    }

    @Operation(summary = "대회 OPEN 포지션 조회",
            description = "특정 대회 시즌 지갑에서 현재 보유 중인 OPEN 포지션 전체를 조회합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/{contestSeasonId}/positions/open")
    public ResponseEntity<List<FuturesPositionResponseDto>> getOpenPositions(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId
    ) {
        return ResponseEntity.ok(futuresQueryService.getOpenPositions(memberId, contestSeasonId));
    }

    @Operation(summary = "대회 CLOSE 포지션 내역 조회",
            description = "특정 대회 시즌 지갑의 청산 완료된 포지션 내역을 커서 방식 무한스크롤로 조회합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/{contestSeasonId}/positions/closed")
    public ResponseEntity<FuturesCursorResponseDto<FuturesPositionResponseDto>> getClosedPositions(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long contestSeasonId,
            @ParameterObject @ModelAttribute FuturesClosedPositionSearchConditionDto condition
    ) {
        return ResponseEntity.ok(futuresQueryService.getClosedPositions(memberId, contestSeasonId, condition));
    }
}
