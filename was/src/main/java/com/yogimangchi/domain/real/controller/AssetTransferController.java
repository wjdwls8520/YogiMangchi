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

import com.yogimangchi.domain.asset.enums.AssetType;
import com.yogimangchi.domain.real.dto.request.TransferHistorySearchCondition;
import com.yogimangchi.domain.real.dto.response.TransferHistoryResponseDto;
import com.yogimangchi.domain.real.dto.response.TransferableAmountResponseDto;
import com.yogimangchi.global.dto.CursorResponseDto;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/v1/real/assets")
@RequiredArgsConstructor
@Tag(name = "99-B1-Real Asset", description = "본투자 자산 관리 API")
public class AssetTransferController {

    private final AssetTransferService assetTransferService;

    // 이체 내역 조회 API
    @Operation(summary = "이체 내역 조회", description = "본투자 지갑 간의 자산 이체 내역을 커서 기반 무한 스크롤로 조회합니다.")
    @GetMapping("/transfer/history")
    public ResponseEntity<CursorResponseDto<TransferHistoryResponseDto>> getTransferHistories(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @ParameterObject @ModelAttribute TransferHistorySearchCondition condition
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        CursorResponseDto<TransferHistoryResponseDto> response = assetTransferService.getTransferHistories(loginMemberId, condition);
        return ResponseEntity.ok(response);
    }

    // 최대 이체 가능 금액 조회 API
    @Operation(summary = "최대 이체 가능 금액 조회", description = "선택한 지갑에서 실제로 이체 가능한 금액(가용 잔고)을 조회합니다.")
    @GetMapping("/transferable")
    public ResponseEntity<TransferableAmountResponseDto> getTransferableAmount(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestParam("assetType") AssetType assetType
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        TransferableAmountResponseDto response = assetTransferService.getTransferableAmount(loginMemberId, assetType);
        return ResponseEntity.ok(response);
    }

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
