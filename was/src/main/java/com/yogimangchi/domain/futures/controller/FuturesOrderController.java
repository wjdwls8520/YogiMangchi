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
@RequestMapping("/api/v1/futures")
@RequiredArgsConstructor
@Tag(name = "99-04-FUTURES", description = "본투자 선물 매매주문 관련 API")
public class FuturesOrderController {

    private final FuturesOrderService futuresOrderService;
    private final FuturesQueryService futuresQueryService;

    @Operation(summary = "본투자 선물 시장가 진입 주문",
            description = "본투자 선물 지갑으로 시장가 진입 주문합니다. 롱(매수)/숏(매도) 방향을 리퀘스트바디에 담아주세요.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @PostMapping("/order/market/open")
    public ResponseEntity<FuturesMarketOrderResponseDto> placeMarketOrderOpen(
            @AuthenticationPrincipal Long memberId,
            @RequestBody @Valid FuturesMarketOrderOpenRequestDto request
    ) {
        return ResponseEntity.ok(futuresOrderService.placeFuturesMarketOrderOpen(memberId, null, request));
    }

    @Operation(summary = "본투자 선물 시장가 청산 주문",
            description = "본투자 선물 지갑에서 보유 포지션을 시장가로 청산합니다. 부분 청산 가능합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @PostMapping("/order/market/close")
    public ResponseEntity<FuturesMarketOrderResponseDto> placeMarketOrderClose(
            @AuthenticationPrincipal Long memberId,
            @RequestBody @Valid FuturesMarketOrderCloseRequestDto request
    ) {
        return ResponseEntity.ok(futuresOrderService.placeFuturesMarketOrderClose(memberId, null, request));
    }

    @Operation(summary = "본투자 선물 주문 내역 조회",
            description = "본투자 선물 지갑의 주문 내역을 커서 방식 무한스크롤로 조회합니다. 체결/미체결 통합 조회이며 orderStatus 필터로 구분 가능합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/orders")
    public ResponseEntity<FuturesCursorResponseDto<FuturesOrderResponseDto>> getOrders(
            @AuthenticationPrincipal Long memberId,
            @ParameterObject @ModelAttribute FuturesOrderSearchConditionDto condition
    ) {
        return ResponseEntity.ok(futuresQueryService.getOrders(memberId, null, condition));
    }

    @Operation(summary = "본투자 OPEN 포지션 조회",
            description = "본투자 선물 지갑에서 현재 보유 중인 OPEN 포지션 전체를 조회합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/positions/open")
    public ResponseEntity<List<FuturesPositionResponseDto>> getOpenPositions(
            @AuthenticationPrincipal Long memberId
    ) {
        return ResponseEntity.ok(futuresQueryService.getOpenPositions(memberId, null));
    }

    @Operation(summary = "본투자 CLOSE 포지션 내역 조회",
            description = "본투자 선물 지갑의 청산 완료된 포지션 내역을 커서 방식 무한스크롤로 조회합니다.")
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @GetMapping("/positions/closed")
    public ResponseEntity<FuturesCursorResponseDto<FuturesPositionResponseDto>> getClosedPositions(
            @AuthenticationPrincipal Long memberId,
            @ParameterObject @ModelAttribute FuturesClosedPositionSearchConditionDto condition
    ) {
        return ResponseEntity.ok(futuresQueryService.getClosedPositions(memberId, null, condition));
    }
}
