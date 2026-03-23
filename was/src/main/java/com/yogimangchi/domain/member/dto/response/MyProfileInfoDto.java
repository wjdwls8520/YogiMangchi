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

        @Schema(description = "이용약관동의 여부", example = "false")
        boolean term_agree,

        @Schema(description = "개인정보동의 여부", example = "false")
        boolean private_agree
) {}
