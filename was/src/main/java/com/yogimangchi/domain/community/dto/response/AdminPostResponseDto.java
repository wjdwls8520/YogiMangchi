package com.yogimangchi.domain.community.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "어드민 게시글 조회 응답 정보 (조인 없이 단일 정보)")
public record AdminPostResponseDto(
        @Schema(description = "게시글 ID", example = "105")
        Long postId,

        @Schema(description = "제목", example = "비트코인 전망")
        String title,

        @Schema(description = "내용", example = "비트코인이 오늘 1억을 돌파했습니다...")
        String content,

        @Schema(description = "좋아요 수", example = "15")
        Long likeCount,

        @Schema(description = "댓글 수", example = "3")
        Long replyCount,

        @Schema(description = "신고 수", example = "0")
        Long reportCount,

        @Schema(description = "삭제 여부 (Y / N)", example = "N")
        String deleteYn,

        @Schema(description = "작성일", example = "2026-05-25T10:00:00")
        LocalDateTime createdAt,

        @Schema(description = "수정일", example = "2026-05-25T10:05:00")
        LocalDateTime updatedAt,

        @Schema(description = "작성자 회원 ID", example = "3")
        Long authorId,

        @Schema(description = "작성자 닉네임", example = "요기망치")
        String authorNickname
) {
}
