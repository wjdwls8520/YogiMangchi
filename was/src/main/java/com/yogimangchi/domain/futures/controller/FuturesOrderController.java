package com.yogimangchi.domain.futures.controller;

import com.yogimangchi.domain.futures.dto.request.FuturesMarketOrderRequestDto;
import com.yogimangchi.domain.futures.dto.response.FuturesOrderResponseDto;
import com.yogimangchi.domain.futures.service.FuturesOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/futures")
@RequiredArgsConstructor
@Tag(name = "99-04-futures", description = "선물 매매주문 관련 API")
public class FuturesOrderController {

    private final FuturesOrderService futuresOrderService;

    @Operation(
            summary = "대회 선물 지갑에서 시장가 주문",
            description = "현재 대회 시즌의 지갑으로 시장가로 주문합니다. 롱(매수)/숏(매도) 정보를 함께 리퀘스트바디에 담아주세요."
    )
    @PreAuthorize("hasAnyRole('VERIFIED_USER', 'ADMIN')")
    @PostMapping("/contest/{contestSeasonId}/order/market")
    public ResponseEntity<FuturesOrderResponseDto> getMarketSymbols(
            @AuthenticationPrincipal Long memberId,
            @PathVariable("contestSeasonId") Long contestSeasonId,
            @RequestBody @Valid FuturesMarketOrderRequestDto request
    ) {

        futuresOrderService.placeFuturesMarketOrder(memberId, contestSeasonId, request);
        return null;
    }
}
