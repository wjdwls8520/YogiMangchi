package com.yogimangchi.domain.spot.controller.v1;

import com.yogimangchi.domain.asset.enums.AssetType;
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

// 모의투자 전용 현물 매매 컨트롤러
@RestController
@RequestMapping("/api/v1/mock/spot")
@RequiredArgsConstructor
@Tag(name = "99-03-SPOT_MOCK", description = "모의투자(현물) 매매 주문 관련 API")
public class MockSpotOrderController {

    // 공통 서비스 로직을 그대로 주입받아 사용합니다.
    private final SpotOrderService spotOrderService;
    private final SpotOrderQueryService spotOrderQueryService;
    private final SpotTradeHistoryQueryService spotTradeHistoryQueryService;

    // 시장가 매수/매도 주문을 처리하는 API 엔드포인트
    @Operation(summary = "시장가 주문 실행", description = "시장가(MARKET)로 코인을 매수하거나 매도합니다.")
    @PostMapping("/order/market")
    public ResponseEntity<String> createMarketOrder(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody MarketOrderRequestDto request
    ) {
        // 프론트엔드에서 파라미터로 AssetType을 받지 않고 강제로 모의투자(MOCK)로 통제합니다.
        spotOrderService.createMarketOrder(memberId, AssetType.MOCK, request);
        return ResponseEntity.ok("주문이 성공적으로 체결되었습니다.");
    }

    // 지정가 매수/매도 주문을 처리하는 API 엔드포인트
    @Operation(summary = "지정가 주문 등록", description = "지정가(LIMIT)로 코인을 매수하거나 매도 주문을 등록합니다.")
    @PostMapping("/order/limit")
    public ResponseEntity<String> createLimitOrder(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody LimitOrderRequestDto request
    ) {
        // 프론트엔드에서 파라미터로 AssetType을 받지 않고 강제로 모의투자(MOCK)로 통제합니다.
        spotOrderService.createLimitOrder(memberId, AssetType.MOCK, request);
        return ResponseEntity.ok("지정가 주문이 성공적으로 접수되었습니다.");
    }

    // 등록된 지정가 주문을 수동으로 취소하는 API 엔드포인트
    @Operation(summary = "주문 취소", description = "미체결 또는 부분 체결 상태의 주문을 취소합니다.")
    @PutMapping("/orders/{orderId}/cancel")
    public ResponseEntity<String> cancelOrder(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long orderId
    ) {
        // 크로스 자산 공격 방어: 취소 시에도 모의투자(MOCK)로 강제 통제합니다.
        spotOrderService.cancelOrder(memberId, AssetType.MOCK, orderId);
        return ResponseEntity.ok("주문이 성공적으로 취소되었습니다.");
    }

    // 체결 완료된 거래 내역을 조회하는 API 엔드포인트
    @Operation(
            summary = "매매 체결 내역 조회",
            description = "조건(지갑 종류, 코인, 매수/매도, 날짜)에 맞는 거래 내역을 커서 기반으로 조회합니다."
    )
    @GetMapping("/histories")
    public ResponseEntity<CursorResponseDto<TradeHistoryResponseDto>> getTradeHistories(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute TradeHistorySearchCondition condition
    ) {
        // 프론트엔드에서 파라미터로 AssetType을 받지 않고 모의투자(MOCK)로 통제합니다.
        CursorResponseDto<TradeHistoryResponseDto> response =
                spotTradeHistoryQueryService.getTradeHistories(memberId, AssetType.MOCK, condition);
        return ResponseEntity.ok(response);
    }

    // 전체 주문 내역(체결, 미체결, 취소 등)을 조회하는 API 엔드포인트
    @Operation(
            summary = "주문 내역 조회",
            description = "조건(지갑 종류, 코인, 매수/매도, 주문 상태, 날짜)에 맞는 주문 내역을 커서 기반으로 조회합니다."
    )
    @GetMapping("/orders")
    public ResponseEntity<CursorResponseDto<OrderResponseDto>> getOrders(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute OrderSearchConditionDto condition
    ) {
        // 프론트엔드에서 파라미터로 AssetType을 받지 않고 모의투자(MOCK)로 통제합니다.
        CursorResponseDto<OrderResponseDto> response = spotOrderQueryService.getOrders(memberId, AssetType.MOCK, condition);
        return ResponseEntity.ok(response);
    }

    // 아직 체결되지 않은(활성화된) 주문 내역만 조회하는 API 엔드포인트
    @Operation(
            summary = "미체결 주문 조회",
            description = "아직 종료되지 않은 주문(PENDING, PARTIALLY_FILLED)만 조회합니다."
    )
    @GetMapping("/orders/open")
    public ResponseEntity<CursorResponseDto<OrderResponseDto>> getOpenOrders(
            @AuthenticationPrincipal Long memberId,
            @Valid @ParameterObject @ModelAttribute OpenOrderSearchConditionDto condition
    ) {
        // 프론트엔드에서 파라미터로 AssetType을 받지 않고 모의투자(MOCK)로 통제합니다.
        CursorResponseDto<OrderResponseDto> response = spotOrderQueryService.getOpenOrders(memberId, AssetType.MOCK, condition);
        return ResponseEntity.ok(response);
    }
}
