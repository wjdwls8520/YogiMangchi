package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.request.ReplyCreateDto;
import com.yogimangchi.domain.community.dto.request.ReplySearchDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.service.ReplyService;
import com.yogimangchi.global.dto.CursorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springdoc.core.annotations.ParameterObject;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community")
@Tag(name = "Community-Reply", description = "커뮤니티 댓글 관련 API")
public class ReplyController {

    private final ReplyService replyService;

    @Operation(
            summary = "게시글의 모든 댓글 조회",
            description = "커서 기반 무한 스크롤로 댓글을 조회합니다. parentId를 보내지 않으면 최상위 댓글, 값이 있다면 대댓글을 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/posts/{postId}/replys")
    public ResponseEntity<CursorResponse<ReplyDetailDto>> getParentReplys(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable Long postId,
            @Valid @ParameterObject @ModelAttribute ReplySearchDto request
    ) {
        CursorResponse<ReplyDetailDto> getReply = replyService.getParentReplys(loginMemberId, postId, request);
        return ResponseEntity.ok(getReply);
    }

    @Operation(
            summary = "특정 유저의 모든 댓글,대댓글 한번에 조회",
            description = "특정 유저의 모든 댓글,대댓글을 커서 기반 무한 스크롤로 조회합니다. \n\n (로그인시 좋아요,신고 유무가 나옴 true로 응답받음),\n\n (삭제된 포스트의 댓글과, 삭제된 댓글은 가져오지않음.)"
    )
    @GetMapping("/member/{memberId}/replys")
    public ResponseEntity<CursorResponse<ReplyDetailDto>> getReplysByAuthor(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable("memberId") Long authorMemberId,
            @Valid @ParameterObject @ModelAttribute ReplySearchDto request
    ) {
        CursorResponse<ReplyDetailDto> replys = replyService.getReplysByAuthor(loginMemberId, authorMemberId, request);

        return ResponseEntity.ok(replys);
    }

    @Operation(
        summary = "댓글 작성",
        description = "게시글에 댓글을 작성합니다."
    )
    @PostMapping("/posts/{postId}/replys")
    public ResponseEntity<ReplyDetailDto> createReply(
        @AuthenticationPrincipal Long loginMemberId,
        @PathVariable Long postId,
        @RequestBody @Valid ReplyCreateDto request

    ) {
        ReplyDetailDto createdReply = replyService.createReply(loginMemberId, postId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdReply);
    }

    @Operation(
            summary = "댓글 수정",
            description = "게시글에 댓글을 수정합니다."
    )
    @PutMapping("/posts/{postId}/replys")
    public ResponseEntity<ReplyDetailDto> updateReply(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable Long postId,
            @RequestParam("replyId") Long replyId,
            @RequestParam("content") String content
    ) {
        ReplyDetailDto updatedReply = replyService.updateReply(loginMemberId, postId, replyId, content);

        return ResponseEntity.ok(updatedReply);
    }

    @Operation(
            summary = "댓글 삭제",
            description = "게시글에 댓글을 삭제 합니다. (댓글은 삭제되더라도 누구에게 작성한 댓글인지는 표시 됨)"
    )
    @DeleteMapping("/posts/{postId}/replys")
    public ResponseEntity<ReplyDetailDto> deleteReply(
            @AuthenticationPrincipal Long loginMemberId,
            @PathVariable Long postId,
            @RequestParam("replyId") Long replyId
    ) {
        replyService.deleteReply(loginMemberId, postId, replyId);

        return ResponseEntity.noContent().build();  // 204
    }
}
