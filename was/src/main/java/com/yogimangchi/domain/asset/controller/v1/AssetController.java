package com.yogimangchi.domain.asset.controller.v1;

import com.yogimangchi.domain.asset.dto.request.ParticipateRequestDto;
import com.yogimangchi.domain.asset.dto.response.PortfolioResponseDto;
import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.asset.service.AssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/asset")
@RequiredArgsConstructor
@Tag(name = "Asset", description = "자산(모의투자 지갑) 관리 API")
public class AssetController {

    private final AssetService assetService;

    @Operation(summary = "콘텐츠 참가(새 지갑 생성)", description = "현물/선물/대회 콘텐츠에 참가하여 새로운 지갑과 초기 자금을 발급받습니다.")
    @PostMapping("/participate")
    public ResponseEntity<String> participate(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody ParticipateRequestDto request) {
        assetService.participate(memberId, request);
        return ResponseEntity.ok(request.assetType() + "콘텐츠의 지갑이 성공적으로 생성되었습니다.");
    }

    @Operation(summary = "콘텐츠 포기(재도전 준비)", description = "진행 중인 지갑을 만료 처리하여 재도전(새 지갑 발급)할 수 있는 상태로 만듭니다.")
    @PostMapping("/give-up")
    public ResponseEntity<String> giveUp(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody ParticipateRequestDto request) {
        assetService.giveUp(memberId, request);
        return ResponseEntity.ok(request.assetType() + "콘텐츠를 포기했습니다. 참가하기를 다시 눌러주세요.");
    }

    @Operation(summary = "내 자산/포트폴리오 조회", description = "현재 지갑의 현금 잔고와 보유 코인 목록, 실시간 수익률을 조회합니다.")
    @GetMapping("/portfolio")
    public ResponseEntity<PortfolioResponseDto> getMyPortfolio(
            @AuthenticationPrincipal Long memberId,
            @RequestParam AssetType assetType) {
        PortfolioResponseDto responseDto = assetService.getMyPortfolio(memberId, assetType);
        return ResponseEntity.ok(responseDto);
    }

}
