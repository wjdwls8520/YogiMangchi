package com.yogimangchi.domain.member.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record FollowResponseDto(
        @Schema(description = "팔로우 대상 멤버 ID", example = "12")
        Long targetId,

        @Schema(description = "팔로우 대상 멤버의 팔로워 수", example = "7")
        Long followerCount,

        @Schema(description = "로그인한 사용자의 팔로우 여부", example = "true")
        Boolean followedByMe
) {}
