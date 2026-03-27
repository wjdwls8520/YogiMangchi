package com.yogimangchi.domain.report.controller.v1;

import com.yogimangchi.domain.report.dto.response.ReportResponseDto;
import com.yogimangchi.domain.report.enums.ReportReasonType;
import com.yogimangchi.domain.report.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/community/posts")
@Tag(name = "Community-Report", description = "커뮤니티 신고 관련 API")
public class ReportController {

    private final ReportService reportService;

    @Operation(
            summary = "게시글 신고",
            description = "게시글을 신고합니다. 본인 게시글은 신고할 수 없습니다. 이미 신고한 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @PutMapping("/{postId}/reports")
    public ResponseEntity<ReportResponseDto> reportPost(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId,
            @RequestParam ReportReasonType reasonType
    ) {
        ReportResponseDto response = reportService.reportPost(memberId, postId, reasonType);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "게시글 신고 취소",
            description = "게시글 신고를 취소합니다. 이미 취소된 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @DeleteMapping("/{postId}/reports")
    public ResponseEntity<ReportResponseDto> unreportPost(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId
    ) {
        ReportResponseDto response = reportService.unreportPost(memberId, postId);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "댓글 신고",
            description = "댓글을 신고합니다. 본인 댓글은 신고할 수 없습니다. 이미 신고한 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @PutMapping("/{postId}/replys/{replyId}/reports")
    public ResponseEntity<ReportResponseDto> reportReply(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId,
            @PathVariable Long replyId,
            @RequestParam ReportReasonType reasonType
    ) {
        ReportResponseDto response = reportService.reportReply(memberId, postId, replyId, reasonType);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "댓글 신고 취소",
            description = "댓글 신고를 취소합니다. 이미 취소된 상태에서 다시 요청해도 멱등하게 처리됩니다."
    )
    @DeleteMapping("/{postId}/replys/{replyId}/reports")
    public ResponseEntity<ReportResponseDto> unreportReply(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long postId,
            @PathVariable Long replyId
    ) {
        ReportResponseDto response = reportService.unreportReply(memberId, postId, replyId);
        return ResponseEntity.ok(response);
    }
}
