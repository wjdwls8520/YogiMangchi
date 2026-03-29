package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.service.LikeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/community")
@RequiredArgsConstructor
@Tag(name = "03 - Me-Community-Contents", description = "내가 좋아요한 글 / 댓글 관련 api")
public class MyCommunityController {

    private final LikeService likeService;

    @Operation(
            summary = "내가 좋아요 누른 모든 게시글 조회",
            description = "내가 좋아요 누른 모든 게시글 조회, 무한 스크롤로 페이징 합니다."
    )
    @GetMapping("/liked-posts")
    public ResponseEntity<Page<PostAndMemberDto>> getLikedPosts(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String keyword
    ) {
        Page<PostAndMemberDto> likedPosts = likeService.getLikedPosts(loginMemberId, page, size, keyword);

        return ResponseEntity.ok(likedPosts);
    }

    @Operation(
            summary = "내가 좋아요 누른 모든 댓글, 대댓글 한번에 조회",
            description = "내가 좋아요 누른 모든 댓글, 대댓글 한번에 조회, 무한 스크롤로 페이징 합니다."
    )
    @GetMapping("/liked-replys")
    public ResponseEntity<Page<ReplyDetailDto>> getLikedReplys(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        Page<ReplyDetailDto> likedReplys = likeService.getLikedReplys(loginMemberId, page, size);

        return ResponseEntity.ok(likedReplys);
    }
}
