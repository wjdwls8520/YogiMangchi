package com.yogimangchi.domain.market.controller.v1;

import com.yogimangchi.domain.market.dto.response.MarketSymbolResponseDto;
import com.yogimangchi.domain.market.enums.MarketType;
import com.yogimangchi.domain.market.service.MarketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/market")
@RequiredArgsConstructor
@Tag(name = "99-01-Market", description = "거래소 마켓(코인 메뉴판) API")
public class MarketController {

    private final MarketService marketService;

    @Operation(summary = "현물 마켓 심볼 조회", description = "현물 거래가 가능한 코인 목록(메뉴판)을 반환합니다.")
    @GetMapping("/spot/symbols")
    public ResponseEntity<List<MarketSymbolResponseDto>> getSpotSymbols() {
        List<MarketSymbolResponseDto> symbols = marketService.getActiveSymbols(MarketType.SPOT);
        return ResponseEntity.ok(symbols);
    }

    @Operation(summary = "선물 마켓 심볼 조회", description = "선물 거래가 가능한 코인 목록(메뉴판)을 반환합니다.")
    @GetMapping("/futures/symbols")
    public ResponseEntity<List<MarketSymbolResponseDto>> getFutureSymbols() {
        List<MarketSymbolResponseDto> symbols = marketService.getActiveFutures();
        return ResponseEntity.ok(symbols);
    }
}