package com.yogimangchi.domain.report.dto.query;

import com.yogimangchi.domain.report.dto.response.MyReportedReplyResponseDto;
import com.yogimangchi.domain.report.dto.response.ReportReasonTypeResponseDto;
import com.yogimangchi.domain.report.enums.ReportReasonType;

import java.time.LocalDateTime;

/**
 * 내가 신고한 댓글/대댓글 목록 조회 시 커서 기반 페이징을 위한 내부 쿼리 DTO.
 */
public record MyReportedReplyQueryDto(
        Long cursorId,
        Long id,
        String content,
        Long likeCount,
        Boolean likedByMe,
        Long reportCount,
        Boolean reportedByMe,
        Long replyCount,
        Long parentReplyId,
        Long targetReplyId,
        Long targetMemberId,
        String targetNickname,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long memberId,
        String nickname,
        String profileImgUrl,
        Long postId,
        String deleteYn,
        ReportReasonType reasonType
) {
    public MyReportedReplyResponseDto toResponseDto() {
        return new MyReportedReplyResponseDto(
                id,
                content,
                likeCount,
                likedByMe,
                reportCount,
                reportedByMe,
                replyCount,
                parentReplyId,
                targetReplyId,
                targetMemberId,
                targetNickname,
                createdAt,
                updatedAt,
                memberId,
                nickname,
                profileImgUrl,
                postId,
                deleteYn,
                ReportReasonTypeResponseDto.from(reasonType)
        );
    }
}
