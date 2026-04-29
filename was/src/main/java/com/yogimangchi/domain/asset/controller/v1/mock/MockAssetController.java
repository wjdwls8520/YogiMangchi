package com.yogimangchi.domain.asset.controller.v1.mock;

import com.yogimangchi.domain.asset.dto.response.MockAssetStatusResponseDto;
import com.yogimangchi.domain.asset.dto.response.AssetPortfolioDetailResponseDto;
import com.yogimangchi.domain.asset.service.mock.MockAssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/asset/mock")
@RequiredArgsConstructor
@Tag(name = "99-02-01-Mock Asset", description = "모의투자 자산탭 전용 API")
public class MockAssetController {

    private final MockAssetService mockAssetService;

    @Operation(summary = "모의투자 참여 상태 조회", description = "로그인 여부와 활성화된 모의투자 지갑 존재 여부만 조회합니다.")
    @GetMapping("/status")
    public ResponseEntity<MockAssetStatusResponseDto> getStatus(Authentication authentication) {
        Long memberId = authentication != null && authentication.getPrincipal() instanceof Long
                ? (Long) authentication.getPrincipal()
                : null;

        return ResponseEntity.ok(mockAssetService.getMockAssetStatus(memberId));
    }

    @Operation(summary = "모의투자 1만달러 지급 (새 지갑 생성)", description = "모의투자에 참가하여 새로운 지갑과 초기 자금을 발급받습니다.")
    @PostMapping("/participate")
    public ResponseEntity<String> participate(@AuthenticationPrincipal Long memberId) {
        mockAssetService.participateMock(memberId);
        return ResponseEntity.ok("모의투자 지갑이 성공적으로 생성되었습니다.");
    }

    @Operation(summary = "모의투자 재도전 (기존 포기)", description = "진행 중인 지갑을 만료 처리하고 계좌 기록을 비워 재도전 할 수 있게 만듭니다.")
    @PostMapping("/give-up")
    public ResponseEntity<String> giveUp(@AuthenticationPrincipal Long memberId) {
        mockAssetService.giveUpMock(memberId);
        return ResponseEntity.ok("모의투자를 포기했습니다. 새롭게 참가하기를 진행해주세요.");
    }

    @Operation(
            summary = "모의투자 자산탭 포트폴리오 상세 조회",
            description = "자산탭에서 사용하는 상세 포트폴리오 응답입니다. 현금 잔고, 잠긴 금액, 보유 코인 목록과 실시간 손익/수익률을 함께 조회합니다."
    )
    @GetMapping("/portfolio")
    public ResponseEntity<AssetPortfolioDetailResponseDto> getMyPortfolio(@AuthenticationPrincipal Long memberId) {
        AssetPortfolioDetailResponseDto responseDto = mockAssetService.getMyMockPortfolio(memberId);
        return ResponseEntity.ok(responseDto);
    }
}
