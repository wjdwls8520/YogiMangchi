package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.request.PostSearchDto;
import com.yogimangchi.domain.community.dto.request.ReplySearchDto;
import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.service.LikeService;
import com.yogimangchi.global.dto.CursorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springdoc.core.annotations.ParameterObject;

@RestController
@RequestMapping("/api/v1/me/community")
@RequiredArgsConstructor
@Tag(name = "03 - Me-Community-Contents", description = "내가 좋아요한 글 / 댓글 관련 api")
public class MyCommunityController {

    private final LikeService likeService;

    @Operation(
            summary = "내가 좋아요 누른 모든 게시글 조회",
            description = "내가 좋아요 누른 모든 게시글을 커서 기반 무한 스크롤로 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/liked-posts")
    public ResponseEntity<CursorResponse<PostAndMemberDto>> getLikedPosts(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @ParameterObject @ModelAttribute PostSearchDto request
    ) {
        CursorResponse<PostAndMemberDto> likedPosts = likeService.getLikedPosts(loginMemberId, request);

        return ResponseEntity.ok(likedPosts);
    }

    @Operation(
            summary = "내가 좋아요 누른 모든 댓글, 대댓글 한번에 조회",
            description = "내가 좋아요 누른 모든 댓글, 대댓글을 커서 기반 무한 스크롤로 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/liked-replys")
    public ResponseEntity<CursorResponse<ReplyDetailDto>> getLikedReplys(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @ParameterObject @ModelAttribute ReplySearchDto request
    ) {
        CursorResponse<ReplyDetailDto> likedReplys = likeService.getLikedReplys(loginMemberId, request);

        return ResponseEntity.ok(likedReplys);
    }
}
