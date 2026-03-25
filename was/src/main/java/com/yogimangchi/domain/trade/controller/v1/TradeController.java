package com.yogimangchi.domain.trade.controller.v1;

import com.yogimangchi.domain.trade.dto.request.MarketOrderRequestDto;
import com.yogimangchi.domain.trade.service.TradeHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trade")
@RequiredArgsConstructor
@Tag(name = "Trade", description = "모의투자 매매(주문) API")
public class TradeController {

    private final TradeHistoryService tradeHistoryService;

    @Operation(summary = "시장가 주문 실행", description = "시장가(MARKET)로 코인을 매수하거나 매도합니다.")
    @Valid
    @PostMapping("/order/market")
    public ResponseEntity<String> createMarketOrder(
            @AuthenticationPrincipal Long memberId,
            @RequestBody MarketOrderRequestDto request
    ){
        tradeHistoryService.executeMarketOrder(memberId,request);

        return ResponseEntity.ok("주문이 성공적으로 체결되었습니다.");
    }

//    // 지정가 주문 API (나중에 개발)
//    @PostMapping("/order/limit")
//    public ResponseEntity<String> createLimitOrder(@RequestBody LimitOrderRequest request) { ... }

}
