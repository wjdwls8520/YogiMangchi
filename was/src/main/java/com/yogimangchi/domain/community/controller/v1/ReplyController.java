package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.request.ReplyCreateDto;
import com.yogimangchi.domain.community.dto.response.PostDetailDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.service.PostService;
import com.yogimangchi.domain.community.service.ReplyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community/posts/{postId}/replys")
@Tag(name = "Community-Reply", description = "커뮤니티 댓글 관련 API")
public class ReplyController {

    private final ReplyService replyService;

    @Operation(
            summary = "댓글 조회",
            description = "parentId를 보내않으면 최상위 댓글, 값이있다면 대댓글"
    )
    @GetMapping
    public ResponseEntity<Page<ReplyDetailDto>> getParentReplys(
            @PathVariable Long postId,
            @RequestParam(required = false) Long parentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        Page<ReplyDetailDto> getReply = replyService.getParentReplys(postId, parentId, page, size);
        return ResponseEntity.ok(getReply);
    }

    @Operation(
        summary = "댓글 작성",
        description = "게시글에 댓글을 작성합니다."
    )
    @PostMapping
    public ResponseEntity<ReplyDetailDto> createReply(
        @AuthenticationPrincipal Long memberId,
        @PathVariable @Valid Long postId,
        @RequestBody @Valid ReplyCreateDto request

    ) {
        ReplyDetailDto createdReply = replyService.createReply(memberId, postId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(createdReply);
    }


}
