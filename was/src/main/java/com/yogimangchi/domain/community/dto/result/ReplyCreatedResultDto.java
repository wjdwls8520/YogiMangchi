package com.yogimangchi.domain.community.dto.result;

import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import java.time.LocalDateTime;

// 댓글 생성 직후의 내부 결과를 담는 DTO로,
// 응답 변환과 알림 생성에서 함께 사용한다.
public record ReplyCreatedResultDto(
        Long id,
        String content,
        Long likeCount,
        Boolean likedByMe,
        Long reportCount,
        Boolean reportedByMe,
        Long replyCount,
        Long parentReplyId,
        Long parentReplyMemberId, // 부모댓글 작성자 id
        Long targetReplyId,
        Long targetMemberId,
        String targetNickname,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Long memberId,
        String nickname,
        String profileImgUrl,
        Long postId,
        String postTitle, // 댓글이 달린 게시글 제목
        Long postAuthorMemberId, // 게시글 작성자 id
        String deleteYn
) {

    public boolean isChildReply() {
        return parentReplyId != null;
    }

    // 대댓글 알림은 실제 target이 있으면 target 작성자에게, 없으면 부모댓글 작성자에게 보낸다.
    public Long resolveReplyReceiverId() {
        return targetMemberId != null ? targetMemberId : parentReplyMemberId;
    }

    // 컨트롤러 응답은 기존 ReplyDetailDto 구조를 그대로 유지한다.
    public ReplyDetailDto toReplyDetailDto() {
        return new ReplyDetailDto(
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
                deleteYn
        );
    }
}
