package com.yogimangchi.domain.community.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record LikeResponseDto(
        @Schema(description = "좋아요 대상 ID", example = "12")
        Long targetId,

        @Schema(description = "좋아요 수", example = "7")
        Long likeCount,

        @Schema(description = "로그인한 사용자의 좋아요 여부", example = "true")
        Boolean likedByMe
) {}
