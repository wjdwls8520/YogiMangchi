package com.yogimangchi.domain.real.controller;

import com.yogimangchi.domain.real.dto.request.TransferRequestDto;
import com.yogimangchi.domain.real.service.AssetTransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/real/assets")
@RequiredArgsConstructor
@Tag(name = "99-B1-Real Asset", description = "본투자 자산 관리 API")
public class AssetTransferController {

    private final AssetTransferService assetTransferService;

    // 본투자 지갑 간 자산 이체 API
    @Operation(summary = "자산 이체", description = "본투자 현물과 선물 지갑 간에 자산을 이체합니다. 최소 이체 금액은 10달러이며, 프론트엔드에서 고유한 requestId를 생성하여 전송해야 합니다.")
    @PostMapping("/transfer")
    public ResponseEntity<Void> transferAsset(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @RequestBody TransferRequestDto request
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        assetTransferService.transferAsset(loginMemberId, request);
        return ResponseEntity.ok().build();
    }
}
