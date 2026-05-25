package com.yogimangchi.domain.community.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "어드민 댓글 조회 응답 정보 (조인 없이 단일 정보)")
public record AdminReplyResponseDto(
        @Schema(description = "댓글 ID", example = "501")
        Long replyId,

        @Schema(description = "댓글 내용", example = "동의합니다!")
        String content,

        @Schema(description = "좋아요 수", example = "2")
        Long likeCount,

        @Schema(description = "신고 수", example = "0")
        Long reportCount,

        @Schema(description = "삭제 여부 (Y / N)", example = "N")
        String deleteYn,

        @Schema(description = "댓글 작성일", example = "2026-05-25T11:20:00")
        LocalDateTime createdAt,

        @Schema(description = "댓글 수정일", example = "2026-05-25T11:25:00")
        LocalDateTime updatedAt,

        @Schema(description = "소속 게시글 ID", example = "105")
        Long postId,

        @Schema(description = "댓글 작성자 회원 ID", example = "5")
        Long authorId
) {
}
