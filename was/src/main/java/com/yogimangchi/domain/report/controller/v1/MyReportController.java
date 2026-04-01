package com.yogimangchi.domain.report.controller.v1;

import com.yogimangchi.domain.community.dto.request.PostSearchDto;
import com.yogimangchi.domain.community.dto.request.ReplySearchDto;
import com.yogimangchi.domain.report.dto.response.MyReportedPostResponseDto;
import com.yogimangchi.domain.report.dto.response.MyReportedReplyResponseDto;
import com.yogimangchi.domain.report.service.ReportService;
import com.yogimangchi.global.dto.CursorResponseDto;
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
@RequestMapping("/api/v1/me/reports")
@RequiredArgsConstructor
@Tag(name = "04 - Me-Report-Contents", description = "내가 신고한 글 / 댓글 / 멤버 관련 api")
public class MyReportController {

    private final ReportService reportService;

    @Operation(
            summary = "내가 신고한 게시글",
            description = "내가 신고한 게시글을 커서 기반 무한 스크롤 방식으로 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/posts")
    public ResponseEntity<CursorResponseDto<MyReportedPostResponseDto>> getReportedPosts(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @ParameterObject @ModelAttribute PostSearchDto request
    ) {
        CursorResponseDto<MyReportedPostResponseDto> reportedPosts = reportService.getReportedPosts(loginMemberId, request);

        return ResponseEntity.ok(reportedPosts);
    }

    @Operation(
            summary = "내가 신고한 모든 댓글, 대댓글 한번에 조회",
            description = "내가 신고한 모든 댓글, 대댓글을 커서 기반 무한 스크롤로 조회합니다. 첫 요청은 cursorId 없이 보내고, 다음 요청부터는 이전 응답의 nextCursorId 를 넣어주세요."
    )
    @GetMapping("/replys")
    public ResponseEntity<CursorResponseDto<MyReportedReplyResponseDto>> getReportedReplys(
            @AuthenticationPrincipal Long loginMemberId,
            @Valid @ParameterObject @ModelAttribute ReplySearchDto request
    ) {
        CursorResponseDto<MyReportedReplyResponseDto> reportedReplys = reportService.getReportedReplys(loginMemberId, request);

        return ResponseEntity.ok(reportedReplys);
    }
}
