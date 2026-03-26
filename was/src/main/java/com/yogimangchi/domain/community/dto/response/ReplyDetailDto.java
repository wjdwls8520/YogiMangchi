package com.yogimangchi.domain.community.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record ReplyDetailDto(
    @Schema(description = "댓글 id", example = "1")
    Long id,

    @Schema(description = "댓글 내용", example = "잘생긴 정진")
    String content,

    @Schema(description = "댓글 좋아요 수", example = "1")
    Long likeCount,

    @Schema(description = "댓글 수", example = "1")
    Long replyCount,

    @Schema(description = "부모댓글 id", example = "1")
    Long parentReplyId,

    @Schema(description = "답글 타겟 멤버의 id", example = "1")
    Long targetMemberId,

    @Schema(description = "답글 타겟 멤버의 닉네임", example = "홍길동스")
    String targetNickname,

    @Schema(description = "댓글이 생성 된 시간", example = "2026-03-24T10:20:00", type = "string", format = "date-time")
    LocalDateTime createdAt,

    @Schema(description = "댓글이 업데이트 된 시간", example = "2026-03-24T10:20:00", type = "string", format = "date-time")
    LocalDateTime updatedAt,

    @Schema(description = "멤버 id", example = "1")
    Long memberId,

    @Schema(description = "멤버 닉네임", example = "정진형님")
    String nickname,

    @Schema(description = "멤버 프로필 url", example = "S3asdasdas.png")
    String profileImgUrl,

    @Schema(description = "댓글이 달린 게시글 Id")
    Long postId
) {}
