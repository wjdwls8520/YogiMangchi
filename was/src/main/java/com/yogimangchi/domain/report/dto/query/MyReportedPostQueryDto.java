package com.yogimangchi.domain.report.dto.query;

import com.yogimangchi.domain.report.dto.response.MyReportedPostResponseDto;
import com.yogimangchi.domain.report.dto.response.ReportReasonTypeResponseDto;
import com.yogimangchi.domain.report.enums.ReportReasonType;

import java.time.LocalDateTime;

/**
 * 내가 신고한 게시글 목록 조회 시 커서 기반 페이징을 위한 내부 쿼리 DTO.
 */
public record MyReportedPostQueryDto(
        Long cursorId,
        Long id,
        String title,
        String content,
        Long likeCount,
        Long replyCount,
        Long reportCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long memberId,
        String nickname,
        String profileImg,
        ReportReasonType reasonType
) {
    public MyReportedPostResponseDto toResponseDto() {
        return new MyReportedPostResponseDto(
                id,
                title,
                content,
                likeCount,
                replyCount,
                reportCount,
                createdAt,
                updatedAt,
                memberId,
                nickname,
                profileImg,
                ReportReasonTypeResponseDto.from(reasonType)
        );
    }
}
