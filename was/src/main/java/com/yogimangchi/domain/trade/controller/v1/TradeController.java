package com.yogimangchi.domain.trade.controller.v1;

import com.yogimangchi.domain.trade.dto.request.LimitOrderRequestDto;
import com.yogimangchi.domain.trade.dto.request.MarketOrderRequestDto;
import com.yogimangchi.domain.trade.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.trade.dto.request.TradeHistorySearchCondition;
import com.yogimangchi.domain.trade.dto.response.CursorResponseDto;
import com.yogimangchi.domain.trade.dto.response.OrderResponseDto;
import com.yogimangchi.domain.trade.dto.response.TradeHistoryResponseDto;
import com.yogimangchi.domain.trade.service.OrderService;
import com.yogimangchi.domain.trade.service.TradeHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springdoc.core.annotations.ParameterObject;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trade")
@RequiredArgsConstructor
@Tag(name = "99-03-Trade", description = "매매주문 관련 API")
public class TradeController {

    private final OrderService orderService;
    private final TradeHistoryService tradeHistoryService;

    @Operation(summary = "시장가 주문 실행", description = "시장가(MARKET)로 코인을 매수하거나 매도합니다.")
    @Valid
    @PostMapping("/order/market")
    public ResponseEntity<String> createMarketOrder(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody MarketOrderRequestDto request
    ){
        tradeHistoryService.executeMarketOrder(memberId,request);

        return ResponseEntity.ok("주문이 성공적으로 체결되었습니다.");
    }

    @Operation(summary = "지정가 주문 등록", description = "지정가(LIMIT)로 코인을 매수하거나 매도 주문을 등록합니다.")
    @Valid
    @PostMapping("/order/limit")
    public ResponseEntity<String> createLimitOrder(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody LimitOrderRequestDto request
    ) {
        orderService.createLimitOrder(memberId, request);

        return ResponseEntity.ok("지정가 주문이 성공적으로 접수되었습니다.");
    }

    @Operation(summary = "주문 취소", description = "미체결 또는 부분 체결 상태의 주문을 취소합니다.")
    @PutMapping("/orders/{orderId}/cancel")
    public ResponseEntity<String> cancelOrder(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long orderId
    ) {
        orderService.cancelOrder(memberId, orderId);

        return ResponseEntity.ok("주문이 성공적으로 취소되었습니다.");
    }


    @Operation(
            summary = "매매 영수증 내역 조회 (무한 스크롤)",
            description = "조건(지갑 종류, 코인, 매수/매도, 날짜 등)에 맞는 거래 내역을 커서 기반으로 조회합니다."
    )
    @GetMapping("/histories")
    public ResponseEntity<CursorResponseDto<TradeHistoryResponseDto>> getTradeHistories(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute TradeHistorySearchCondition condition
    ) {
        // 서비스 호출 (memberId와 검색 조건 상자를 통째로 넘김)
        CursorResponseDto<TradeHistoryResponseDto> response = tradeHistoryService.getTradeHistories(memberId, condition);

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "주문내역 조회 (무한 스크롤)",
            description = "조건(지갑 종류, 코인, 매수/매도, 주문 상태, 날짜 등)에 맞는 주문 내역을 커서 기반으로 조회합니다."
    )
    @GetMapping("/orders")
    public ResponseEntity<CursorResponseDto<OrderResponseDto>> getOrders(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute OrderSearchConditionDto condition
    ) {
        CursorResponseDto<OrderResponseDto> response = orderService.getOrders(memberId, condition);

        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "미체결 주문 조회 (무한 스크롤)",
            description = "현재 종료되지 않은 주문(PENDING, PARTIALLY_FILLED)만 조회합니다."
    )
    @GetMapping("/orders/open")
    public ResponseEntity<CursorResponseDto<OrderResponseDto>> getOpenOrders(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute OpenOrderSearchConditionDto condition
    ) {
        CursorResponseDto<OrderResponseDto> response = orderService.getOpenOrders(memberId, condition);

        return ResponseEntity.ok(response);
    }

}
