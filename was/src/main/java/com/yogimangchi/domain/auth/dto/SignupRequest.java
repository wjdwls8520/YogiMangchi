package com.yogimangchi.domain.auth.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import io.swagger.v3.oas.annotations.media.Schema;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SignupRequest(
        @Schema(description = "회원가입용 임시 토큰", example = "abc.123.xyz")
        String signupToken,

        @Schema(description = "사용자 닉네임", example = "정진")
        String nickname,

        @Schema(description = "프로필 이미지 file_id", example = "asdasdas.png")
        String profileImgUrl,

        @Schema(description = "서비스 이용약관 동의 여부", example = "true")
        boolean termAgree,

        @Schema(description = "개인정보 처리방침 동의 여부", example = "true")
        boolean privateAgree,

        @Schema(description = "프로필 상태 메시지", example = "안녕하세요!")
        String profileMsg
) {
}
