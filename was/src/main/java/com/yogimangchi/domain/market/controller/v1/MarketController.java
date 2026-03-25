package com.yogimangchi.domain.market.controller.v1;

import com.yogimangchi.domain.market.dto.response.MarketSymbolResponseDto;
import com.yogimangchi.domain.market.repository.MarketSymbolRepository;
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
@Tag(name = "Market", description = "거래소 마켓(코인 메뉴판) API")
public class MarketController {

    private final MarketSymbolRepository marketSymbolRepository;

    @Operation(summary = "거래 가능한 마켓 심볼 목록 조회", description = "현재 거래소에서 거래 가능한 모든 코인 목록(메뉴판)을 반환합니다.")
    @GetMapping("/symbols")
    public ResponseEntity<List<MarketSymbolResponseDto>> getActiveSymbols() {

        List<MarketSymbolResponseDto> symbols = marketSymbolRepository.findAllByIsActiveTrue()
                .stream()
                .map(MarketSymbolResponseDto::from)
                .toList();

        return ResponseEntity.ok(symbols);
    }
}