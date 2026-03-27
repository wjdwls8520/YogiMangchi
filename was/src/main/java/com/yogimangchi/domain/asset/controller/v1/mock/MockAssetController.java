package com.yogimangchi.domain.asset.controller.v1.mock;

import com.yogimangchi.domain.asset.dto.response.PortfolioResponseDto;
import com.yogimangchi.domain.asset.service.mock.MockAssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/asset/mock")
@RequiredArgsConstructor
@Tag(name = "Mock Asset", description = "모의투자 전용 API")
public class MockAssetController {

    private final MockAssetService mockAssetService;

    @Operation(summary = "모의투자 10만달러 지급 (새 지갑 생성)", description = "모의투자에 참가하여 새로운 지갑과 초기 자금을 발급받습니다.")
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

    @Operation(summary = "모의투자 포트폴리오 조회", description = "현재 모의투자 지갑의 현금 잔고와 보유 코인 목록, 실시간 수익률을 조회합니다.")
    @GetMapping("/portfolio")
    public ResponseEntity<PortfolioResponseDto> getMyPortfolio(@AuthenticationPrincipal Long memberId) {
        PortfolioResponseDto responseDto = mockAssetService.getMyMockPortfolio(memberId);
        return ResponseEntity.ok(responseDto);
    }
}
