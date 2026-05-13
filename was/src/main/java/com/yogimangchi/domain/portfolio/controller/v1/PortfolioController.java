package com.yogimangchi.domain.portfolio.controller.v1;

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.portfolio.dto.response.ProfilePortfolioResponseDto;
import com.yogimangchi.domain.portfolio.service.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/portfolio")
@RequiredArgsConstructor
@Tag(name = "99-01-Portfolio", description = "멤버 프로필 투자 성과 및 포트폴리오 API")
public class PortfolioController {

    private final PortfolioService portfolioService;

    @Operation(
            summary = "내 프로필 포트폴리오 조회",
            description = "내 프로필 화면에서 사용하는 자산 타입별(MOCK, TRADE_SPOT 등) 포트폴리오를 조회합니다. 총자산, 손익, 수익률, 보유 종목 목록과 updatedAt 을 함께 반환합니다. 회원은 존재하지만 아직 해당 타입의 지갑이 없으면 204 No Content 를 반환합니다."
    )
    @GetMapping("/me")
    public ResponseEntity<ProfilePortfolioResponseDto> getMyProfilePortfolio(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestParam(defaultValue = "MOCK") AssetType assetType
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<ProfilePortfolioResponseDto> portfolio = portfolioService.getMyProfilePortfolio(loginMemberId, assetType);
        return portfolio
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @Operation(
            summary = "다른 멤버 프로필 포트폴리오 조회",
            description = "다른 멤버 프로필 화면에서 사용하는 자산 타입별 포트폴리오를 조회합니다. 대상 회원이 없거나 탈퇴한 경우 404, 회원은 존재하지만 아직 해당 타입의 지갑이 없으면 204 No Content 를 반환합니다."
    )
    @GetMapping("/{memberId}")
    public ResponseEntity<ProfilePortfolioResponseDto> getMemberPortfolio(
            @PathVariable Long memberId,
            @RequestParam(defaultValue = "MOCK") AssetType assetType
    ) {
        Optional<ProfilePortfolioResponseDto> portfolio = portfolioService.getMemberProfilePortfolio(memberId, assetType);
        return portfolio
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}