package com.yogimangchi.domain.community.dto.query;

import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;

import java.time.LocalDateTime;

/**
 * 좋아요/신고 게시글 목록 조회 시 조인 테이블의 ID를 커서로 활용하기 위한 내부 쿼리 DTO.
 * <p>API 응답에는 {@link PostAndMemberDto}로 변환하여 사용합니다.</p>
 */
public record PostQueryDto(
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
        String profileImg
) {
    public PostAndMemberDto toPostAndMemberDto() {
        return new PostAndMemberDto(id, title, content, likeCount, replyCount, reportCount, createdAt, updatedAt, memberId, nickname, profileImg);
    }
}
