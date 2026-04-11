package com.yogimangchi.domain.spot.controller.v1;

import com.yogimangchi.domain.spot.dto.request.LimitOrderRequestDto;
import com.yogimangchi.domain.spot.dto.request.MarketOrderRequestDto;
import com.yogimangchi.domain.spot.dto.request.OpenOrderSearchConditionDto;
import com.yogimangchi.domain.spot.dto.request.OrderSearchConditionDto;
import com.yogimangchi.domain.spot.dto.request.TradeHistorySearchCondition;
import com.yogimangchi.domain.spot.dto.response.CursorResponseDto;
import com.yogimangchi.domain.spot.dto.response.OrderResponseDto;
import com.yogimangchi.domain.spot.dto.response.TradeHistoryResponseDto;
import com.yogimangchi.domain.spot.service.SpotOrderQueryService;
import com.yogimangchi.domain.spot.service.SpotOrderService;
import com.yogimangchi.domain.spot.service.SpotTradeHistoryQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/spot/mock")
@RequiredArgsConstructor
@Tag(name = "99-03-SPOT_MOCK", description = "모의투자(현물) 매매 주문 관련 API")
public class SpotOrderController {

    private final SpotOrderService spotOrderService;
    private final SpotOrderQueryService spotOrderQueryService;
    private final SpotTradeHistoryQueryService spotTradeHistoryQueryService;

    @Operation(summary = "시장가 주문 실행", description = "시장가(MARKET)로 코인을 매수하거나 매도합니다.")
    @Valid
    @PostMapping("/order/market")
    public ResponseEntity<String> createMarketOrder(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody MarketOrderRequestDto request
    ) {
        spotOrderService.createMarketOrder(memberId, request);
        return ResponseEntity.ok("주문이 성공적으로 체결되었습니다.");
    }

    @Operation(summary = "지정가 주문 등록", description = "지정가(LIMIT)로 코인을 매수하거나 매도 주문을 등록합니다.")
    @Valid
    @PostMapping("/order/limit")
    public ResponseEntity<String> createLimitOrder(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody LimitOrderRequestDto request
    ) {
        spotOrderService.createLimitOrder(memberId, request);
        return ResponseEntity.ok("지정가 주문이 성공적으로 접수되었습니다.");
    }

    @Operation(summary = "주문 취소", description = "미체결 또는 부분 체결 상태의 주문을 취소합니다.")
    @PutMapping("/orders/{orderId}/cancel")
    public ResponseEntity<String> cancelOrder(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long orderId
    ) {
        spotOrderService.cancelOrder(memberId, orderId);
        return ResponseEntity.ok("주문이 성공적으로 취소되었습니다.");
    }

    @Operation(
            summary = "매매 체결 내역 조회",
            description = "조건(지갑 종류, 코인, 매수/매도, 날짜)에 맞는 거래 내역을 커서 기반으로 조회합니다."
    )
    @GetMapping("/histories")
    public ResponseEntity<CursorResponseDto<TradeHistoryResponseDto>> getTradeHistories(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute TradeHistorySearchCondition condition
    ) {
        CursorResponseDto<TradeHistoryResponseDto> response =
                spotTradeHistoryQueryService.getTradeHistories(memberId, condition);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "주문 내역 조회",
            description = "조건(지갑 종류, 코인, 매수/매도, 주문 상태, 날짜)에 맞는 주문 내역을 커서 기반으로 조회합니다."
    )
    @GetMapping("/orders")
    public ResponseEntity<CursorResponseDto<OrderResponseDto>> getOrders(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute OrderSearchConditionDto condition
    ) {
        CursorResponseDto<OrderResponseDto> response = spotOrderQueryService.getOrders(memberId, condition);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "미체결 주문 조회",
            description = "아직 종료되지 않은 주문(PENDING, PARTIALLY_FILLED)만 조회합니다."
    )
    @GetMapping("/orders/open")
    public ResponseEntity<CursorResponseDto<OrderResponseDto>> getOpenOrders(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute OpenOrderSearchConditionDto condition
    ) {
        CursorResponseDto<OrderResponseDto> response = spotOrderQueryService.getOpenOrders(memberId, condition);
        return ResponseEntity.ok(response);
    }
}
