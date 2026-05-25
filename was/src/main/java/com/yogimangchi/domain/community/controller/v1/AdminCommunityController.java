package com.yogimangchi.domain.community.controller.v1;

import com.yogimangchi.domain.community.dto.request.AdminPostSearchDto;
import com.yogimangchi.domain.community.dto.request.AdminReplySearchDto;
import com.yogimangchi.domain.community.dto.response.AdminPostResponseDto;
import com.yogimangchi.domain.community.dto.response.AdminReplyResponseDto;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.community.repository.ReplyRepository;
import com.yogimangchi.domain.community.service.PostService;
import com.yogimangchi.domain.community.service.ReplyService;
import com.yogimangchi.global.dto.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/community")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "99 - ADMIN - Community", description = "관리자 - 커뮤니티 관리 API")
public class AdminCommunityController {

    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;
    private final PostService postService;
    private final ReplyService replyService;

    @Operation(
            summary = "모든 게시글 조회",
            description = "작성자 상태 및 삭제 여부와 상관없이 시스템의 모든 게시글을 최신순 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/posts")
    public ResponseEntity<CursorResponseDto<AdminPostResponseDto>> getPosts(
            @Valid @ParameterObject @ModelAttribute AdminPostSearchDto searchDto
    ) {
        return getPostsInternal(searchDto, "ALL");
    }

    @Operation(
            summary = "탈퇴한 회원의 게시글 조회",
            description = "이미 탈퇴한 회원이 작성한 게시글을 최신순 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/posts/withdrawn-author")
    public ResponseEntity<CursorResponseDto<AdminPostResponseDto>> getWithdrawnAuthorPosts(
            @Valid @ParameterObject @ModelAttribute AdminPostSearchDto searchDto
    ) {
        return getPostsInternal(searchDto, "WITHDRAWN");
    }

    @Operation(
            summary = "탈퇴하지 않은 회원의 게시글 조회",
            description = "활동 중인(탈퇴하지 않은) 회원이 작성한 게시글을 최신순 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/posts/active-author")
    public ResponseEntity<CursorResponseDto<AdminPostResponseDto>> getActiveAuthorPosts(
            @Valid @ParameterObject @ModelAttribute AdminPostSearchDto searchDto
    ) {
        return getPostsInternal(searchDto, "ACTIVE");
    }

    @Operation(
            summary = "게시글 강제 삭제",
            description = "관리자 권한으로 특정 게시글을 삭제(소프트 삭제) 처리합니다."
    )
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePostByAdmin(
            @AuthenticationPrincipal Long loginMemberId,
            @Parameter(description = "삭제할 게시글 ID", example = "105")
            @PathVariable Long postId
    ) {
        postService.deletePost(loginMemberId, postId);
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "모든 댓글 조회",
            description = "작성자 상태 및 삭제 여부와 상관없이 시스템의 모든 댓글을 최신순 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/replies")
    public ResponseEntity<CursorResponseDto<AdminReplyResponseDto>> getReplies(
            @Valid @ParameterObject @ModelAttribute AdminReplySearchDto searchDto
    ) {
        return getRepliesInternal(searchDto, "ALL");
    }

    @Operation(
            summary = "탈퇴한 회원의 댓글 조회",
            description = "이미 탈퇴한 회원이 작성한 댓글을 최신순 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/replies/withdrawn-author")
    public ResponseEntity<CursorResponseDto<AdminReplyResponseDto>> getWithdrawnAuthorReplies(
            @Valid @ParameterObject @ModelAttribute AdminReplySearchDto searchDto
    ) {
        return getRepliesInternal(searchDto, "WITHDRAWN");
    }

    @Operation(
            summary = "탈퇴하지 않은 회원의 댓글 조회",
            description = "활동 중인(탈퇴하지 않은) 회원이 작성한 댓글을 최신순 커서 기반 무한 스크롤로 조회합니다."
    )
    @GetMapping("/replies/active-author")
    public ResponseEntity<CursorResponseDto<AdminReplyResponseDto>> getActiveAuthorReplies(
            @Valid @ParameterObject @ModelAttribute AdminReplySearchDto searchDto
    ) {
        return getRepliesInternal(searchDto, "ACTIVE");
    }

    @Operation(
            summary = "댓글 강제 삭제",
            description = "관리자 권한으로 특정 댓글을 삭제(소프트 삭제) 처리합니다."
    )
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> deleteReplyByAdmin(
            @AuthenticationPrincipal Long loginMemberId,
            @Parameter(description = "삭제할 댓글 ID", example = "501")
            @PathVariable Long replyId
    ) {
        Reply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));
        Long postId = reply.getPost().getId();
        replyService.deleteReply(loginMemberId, postId, replyId);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<CursorResponseDto<AdminPostResponseDto>> getPostsInternal(
            AdminPostSearchDto searchDto, String authorStatus
    ) {
        int limitSize = searchDto.getOrDefaultSize();
        List<AdminPostResponseDto> posts = postRepository.findPostsByCursor(searchDto, authorStatus);

        boolean hasNext = posts.size() > limitSize;
        if (hasNext) {
            posts = new ArrayList<>(posts.subList(0, limitSize));
        }

        Long nextCursorId = null;
        if (!posts.isEmpty() && hasNext) {
            nextCursorId = posts.get(posts.size() - 1).postId();
        }

        return ResponseEntity.ok(new CursorResponseDto<>(posts, nextCursorId, hasNext));
    }

    private ResponseEntity<CursorResponseDto<AdminReplyResponseDto>> getRepliesInternal(
            AdminReplySearchDto searchDto, String authorStatus
    ) {
        int limitSize = searchDto.getOrDefaultSize();
        List<AdminReplyResponseDto> replies = replyRepository.findRepliesByCursor(searchDto, authorStatus);

        boolean hasNext = replies.size() > limitSize;
        if (hasNext) {
            replies = new ArrayList<>(replies.subList(0, limitSize));
        }

        Long nextCursorId = null;
        if (!replies.isEmpty() && hasNext) {
            nextCursorId = replies.get(replies.size() - 1).replyId();
        }

        return ResponseEntity.ok(new CursorResponseDto<>(replies, nextCursorId, hasNext));
    }
}
