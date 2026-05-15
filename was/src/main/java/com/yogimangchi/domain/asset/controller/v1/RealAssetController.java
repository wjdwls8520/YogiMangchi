package com.yogimangchi.domain.asset.controller.v1;

import com.yogimangchi.domain.asset.dto.response.RealAssetUnifiedResponseDto;
import com.yogimangchi.domain.asset.service.RealAssetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/asset/real")
@RequiredArgsConstructor
@Tag(name = "99-03-02-Real Asset", description = "본투자 자산 관리 API")
public class RealAssetController {

    private final RealAssetService realAssetService;

    @Operation(summary = "본투자 통합 자산 조회 (현물 + 선물)", 
               description = "본투자 진입 시 한 번의 API 호출로 현물 자산, 선물 자산, 통합 총자산을 반환합니다. 프론트엔드 실시간 렌더링의 기준점(Snapshot)으로 사용하세요.")
    @GetMapping("/detail")
    public ResponseEntity<RealAssetUnifiedResponseDto> getUnifiedRealAssetDetail(
            @AuthenticationPrincipal Long memberId) {

        RealAssetUnifiedResponseDto responseDto = realAssetService.getUnifiedRealAssetPortfolio(memberId);
        return ResponseEntity.ok(responseDto);
    }
}