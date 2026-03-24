package com.yogimangchi.domain.member.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record MyProfileInfoDto(
        @Schema(description = "member idx", example = "12")
        Long memberId,

        @Schema(description = "소셜 종류", example = "kakao")
        String provider,

        @Schema(description = "멤버 닉네임", example = "홍길동")
        String nickname,

        @Schema(description = "프로필이미지", example = "assdsss.png")
        String profileImgUrl,

        @Schema(description = "프로필메세지", example = "안녕하세요. 스나이퍼입니다.")
        String profileMsg,

        @Schema(description = "인기도 수", example = "777")
        Long bestCount,

        @Schema(description = "내가 팔로우한 수", example = "3")
        Long followerCount,

        @Schema(description = "나를 팔로우한 수", example = "7")
        Long followingCount,

        @Schema(description = "이용약관동의 여부", example = "false")
        boolean term_agree,

        @Schema(description = "개인정보동의 여부", example = "false")
        boolean private_agree
) {}
