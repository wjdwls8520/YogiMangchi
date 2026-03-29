package com.yogimangchi.domain.member.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record MemberProfileInfoDto(
    @Schema(description = "member idx", example = "12")
    Long memberId,

    @Schema(description = "멤버 닉네임", example = "홍길동")
    String nickname,

    @Schema(description = "프로필이미지", example = "assdsss.png")
    String profileImgUrl,

    @Schema(description = "프로필메세지", example = "안녕하세요. 스나이퍼입니다.")
    String profileMsg,

    @Schema(description = "인기도 수", example = "777")
    Long bestCount,

    @Schema(description = "나를 팔로우한 수", example = "3")
    Long followerCount,

    @Schema(description = "내가 팔로우한 수", example = "7")
    Long followingCount,

    @Schema(description = "로그인한 사용자가 이 멤버를 팔로우하고 있는지 여부", example = "true")
    Boolean followedByMe,

    @Schema(description = "로그인한 사용자가 이 멤버에게 팔로우받고 있는지 여부", example = "false")
    Boolean followingMe
) {}
