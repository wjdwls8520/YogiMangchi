package com.yogimangchi.domain.report.controller.v1;

import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.report.service.ReportService;
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
@RequestMapping("/api/v1/me/reports")
@RequiredArgsConstructor
@Tag(name = "04 - Me-Report-Contents", description = "내가 신고한 글 / 댓글 / 멤버 관련 api")
public class MyReportController {

    private final ReportService reportService;

    @Operation(
            summary = "내가 신고한 게시글",
            description = "내가 신고한 게시글을 무한 스크롤 방식으로 조회합니다."
    )
    @GetMapping("/posts")
    public ResponseEntity<Page<PostAndMemberDto>> getReportedPosts(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String keyword
    ) {
        Page<PostAndMemberDto> reportedPosts = reportService.getReportedPosts(loginMemberId, page, size, keyword);

        return ResponseEntity.ok(reportedPosts);
    }

    @Operation(
            summary = "내가 신고한 모든 댓글, 대댓글 한번에 조회",
            description = "내가 신고한 모든 댓글, 대댓글 한번에 조회, 무한 스크롤로 페이징 합니다."
    )
    @GetMapping("/replys")
    public ResponseEntity<Page<ReplyDetailDto>> getReportedReplys(
            @AuthenticationPrincipal Long loginMemberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        Page<ReplyDetailDto> reportedReplys = reportService.getReportedReplys(loginMemberId, page, size);

        return ResponseEntity.ok(reportedReplys);
    }
}
