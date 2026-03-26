package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.response.LikeResponseDto;
import com.yogimangchi.domain.community.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community/posts")
@Tag(name = "Community-Like", description = "커뮤니티 좋아요 관련 API")
public class LikeController {

    private final LikeService likeService;

    @Operation(
            summary = "게시글 좋아요",
            description = "게시글 좋아요를 등록합니다. 이미 좋아요를 누른 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @PutMapping("/{postId}/likes")
    public ResponseEntity<LikeResponseDto> likePost(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId
    ) {
        LikeResponseDto response = likeService.likePost(memberId, postId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "게시글 좋아요 취소",
            description = "게시글 좋아요를 취소합니다. 이미 취소된 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @DeleteMapping("/{postId}/likes")
    public ResponseEntity<LikeResponseDto> unlikePost(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId
    ) {
        LikeResponseDto response = likeService.unlikePost(memberId, postId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "댓글 좋아요",
            description = "댓글 좋아요를 등록합니다. 이미 좋아요를 누른 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @PutMapping("/{postId}/replys/{replyId}/likes")
    public ResponseEntity<LikeResponseDto> likeReply(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId,
            @PathVariable Long replyId
    ) {
        LikeResponseDto response = likeService.likeReply(memberId, postId, replyId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "댓글 좋아요 취소",
            description = "댓글 좋아요를 취소합니다. 이미 취소된 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @DeleteMapping("/{postId}/replys/{replyId}/likes")
    public ResponseEntity<LikeResponseDto> unlikeReply(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId,
            @PathVariable Long replyId
    ) {
        LikeResponseDto response = likeService.unlikeReply(memberId, postId, replyId);
        return ResponseEntity.ok(response);
    }
}
