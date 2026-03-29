package com.yogimangchi.domain.community.dto.query;

import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;

import java.time.LocalDateTime;

/**
 * 좋아요/신고 댓글 목록 조회 시 조인 테이블의 ID를 커서로 활용하기 위한 내부 쿼리 DTO.
 * <p>API 응답에는 {@link ReplyDetailDto}로 변환하여 사용합니다.</p>
 */
public record ReplyQueryDto(
        Long cursorId,
        Long id,
        String content,
        Long likeCount,
        Boolean likedByMe,
        Long reportCount,
        Boolean reportedByMe,
        Long replyCount,
        Long parentReplyId,
        Long targetMemberId,
        String targetNickname,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long memberId,
        String nickname,
        String profileImgUrl,
        Long postId
) {
    public ReplyDetailDto toReplyDetailDto() {
        return new ReplyDetailDto(id, content, likeCount, likedByMe, reportCount, reportedByMe, replyCount,
                parentReplyId, targetMemberId, targetNickname, createdAt, updatedAt, memberId, nickname, profileImgUrl, postId);
    }
}
