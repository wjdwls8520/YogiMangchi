package com.yogimangchi.domain.member.controller.v1;

import com.yogimangchi.domain.member.service.FavoriteSymbolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 프론트엔드와 통신하는 즐겨찾기 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/favorites/symbols")
@RequiredArgsConstructor
@Tag(name = "02-1 - Favorite", description = "마켓 심볼 즐겨찾기 API")
public class FavoriteSymbolController {

    private final FavoriteSymbolService favoriteSymbolService;

    @Operation(summary = "즐겨찾기 추가", description = "특정 마켓 심볼을 즐겨찾기에 추가합니다.")
    @PostMapping("/{symbol}")
    public ResponseEntity<Void> addFavorite(
            @AuthenticationPrincipal Long loginMemberId, // 현재 로그인한 회원의 ID 자동 주입
            @PathVariable String symbol                  // URL에서 심볼 파라미터 추출
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        favoriteSymbolService.addFavorite(loginMemberId, symbol);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "즐겨찾기 삭제", description = "특정 마켓 심볼을 즐겨찾기에서 제거합니다.")
    @DeleteMapping("/{symbol}")
    public ResponseEntity<Void> removeFavorite(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable String symbol
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        favoriteSymbolService.removeFavorite(loginMemberId, symbol);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "즐겨찾기 목록 조회", description = "회원이 즐겨찾기한 마켓 심볼(String) 목록을 최신순으로 반환합니다.")
    @GetMapping
    public ResponseEntity<List<String>> getFavorites(
            @AuthenticationPrincipal Long loginMemberId
    ) {
        if (loginMemberId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        // 프론트엔드의 즐겨찾기 관리 형태(string[])에 맞게 String 리스트 반환
        List<String> symbols = favoriteSymbolService.getFavoriteSymbols(loginMemberId);
        return ResponseEntity.ok(symbols);
    }
}
