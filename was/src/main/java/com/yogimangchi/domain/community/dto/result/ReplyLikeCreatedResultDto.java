package com.yogimangchi.domain.community.dto.result;

import com.yogimangchi.domain.community.dto.response.LikeResponseDto;

// 댓글 좋아요 생성 직후의 내부 결과를 담는 DTO로,
// 파사드가 알림 생성과 최종 응답 변환에 함께 사용한다.
public record ReplyLikeCreatedResultDto(
        Long postId,
        Long replyId,
        Long likeCount,
        Boolean likedByMe,
        boolean newLikeCreated, // 실제로 새로운 좋아요 row가 생성되었는지 여부
        Long actorMemberId, // 좋아요를 누른 회원 id
        Long receiverMemberId // 댓글 작성자 회원 id
) {

    public LikeResponseDto toLikeResponseDto() {
        return new LikeResponseDto(
                replyId,
                likeCount,
                likedByMe
        );
    }
}
