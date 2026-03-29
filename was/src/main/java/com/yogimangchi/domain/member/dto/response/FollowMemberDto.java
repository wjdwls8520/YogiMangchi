package com.yogimangchi.domain.member.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record FollowMemberDto(
        @Schema(description = "멤버 ID", example = "12")
        Long memberId,

        @Schema(description = "멤버 닉네임", example = "홍길동")
        String nickname,

        @Schema(description = "프로필 이미지 URL", example = "https://cdn.example.com/profile.png")
        String profileImgUrl,

        @Schema(description = "프로필 메시지", example = "안녕하세요. 스나이퍼입니다.")
        String profileMsg,

        @Schema(description = "인기도 수", example = "777")
        Long bestCount,

        @Schema(description = "팔로워 수", example = "7")
        Long followerCount,

        @Schema(description = "팔로잉 수", example = "3")
        Long followingCount,

        @Schema(description = "팔로우 관계 생성일시", example = "2026-03-29T10:20:00", type = "string", format = "date-time")
        LocalDateTime followCreatedAt
) {}
