package com.yogimangchi.domain.report.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "내가 신고한 게시글 목록 응답 DTO")
public record MyReportedPostResponseDto(
        @Schema(description = "게시글 ID", example = "12")
        Long id,

        @Schema(description = "게시글 제목", example = "오늘 시장 정리")
        String title,

        @Schema(description = "게시글 내용", example = "내용")
        String content,

        @Schema(description = "좋아요 수", example = "101")
        Long likeCount,

        @Schema(description = "댓글 수", example = "101")
        Long replyCount,

        @Schema(description = "신고 수", example = "101")
        Long reportCount,

        @Schema(description = "작성일시", example = "2026-03-24T10:20:00", type = "string", format = "date-time")
        LocalDateTime createdAt,

        @Schema(description = "수정일시", example = "2026-03-24T10:20:00", type = "string", format = "date-time")
        LocalDateTime updatedAt,

        @Schema(description = "작성자 ID", example = "101")
        Long memberId,

        @Schema(description = "작성자 닉네임", example = "망치길동")
        String nickname,

        @Schema(description = "작성자 프로필 이미지 URL", example = "asdascasds.png")
        String profileImg,

        @Schema(description = "내가 선택한 신고 사유")
        ReportReasonTypeResponseDto reportReason
) {}
