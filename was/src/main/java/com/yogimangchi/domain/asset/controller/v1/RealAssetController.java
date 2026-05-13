package com.yogimangchi.domain.asset.controller.v1;

import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.service.AssetSpotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/asset/real")
@RequiredArgsConstructor
@Tag(name = "99-03-02Real Asset", description = "본투자 자산 관리 API")
public class RealAssetController {

    private final AssetSpotService assetSpotService;

    @Operation(summary = "본투자 현물 자산 상세 조회", description = "본투자 현물(SPOT) 지갑의 잔고 및 보유 코인을 조회합니다.")
    @GetMapping("/spot/detail")
    public ResponseEntity<AssetPortfolioDetailResponseDto> getRealSpotAssetDetail(
            @AuthenticationPrincipal Long memberId) {

        AssetPortfolioDetailResponseDto responseDto = assetSpotService.getMySpotPortfolio(memberId);
        return ResponseEntity.ok(responseDto);
    }

    @Operation(summary = "본투자 선물 자산 상세 조회", description = "본투자 선물(FUTURES) 지갑의 증거금 및 포지션을 조회합니다. (현재 미구현)")
    @GetMapping("/futures/detail")
    public ResponseEntity<AssetPortfolioDetailResponseDto> getRealFuturesAssetDetail(
            @AuthenticationPrincipal Long memberId) {

        // 추후 AssetFuturesService 연동 시 구현
        throw new UnsupportedOperationException("현재 선물(FUTURES) 자산 조회 기능은 준비 중입니다.");
    }
}